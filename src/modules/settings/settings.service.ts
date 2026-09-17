import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { AuditAction } from '../audit/enums/audit-action.enum.js';
import { AuditEntityType } from '../audit/enums/audit-entity-type.enum.js';
import { AuditService } from '../audit/audit.service.js';
import { UpdateShopSettingsDto } from './dto/update-shop-settings.dto.js';
import {
  SHOP_SETTINGS_KEY,
  ShopSettings,
  ShopSettingsDocument,
} from './schemas/shop-settings.schema.js';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(ShopSettings.name)
    private readonly settingsModel: Model<ShopSettingsDocument>,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async getReceiptSettings() {
    const doc = await this.settingsModel
      .findOne({ key: SHOP_SETTINGS_KEY })
      .exec();
    const envShop = this.configService.get<{
      name: string;
      phone: string;
      address: string;
    }>('shop')!;

    return {
      shop: {
        name: doc?.name ?? envShop.name,
        phone: doc?.phone ?? envShop.phone,
        address: doc?.address ?? envShop.address,
      },
      alerts: {
        overdueRepairDays:
          doc?.overdueRepairDays ??
          this.configService.get<number>('alerts.overdueRepairDays') ??
          7,
        largeDebtThreshold:
          doc?.largeDebtThreshold ??
          this.configService.get<number>('alerts.largeDebtThreshold') ??
          5_000_000,
      },
    };
  }

  async updateShopSettings(
    dto: UpdateShopSettingsDto,
    userId: string,
    ipAddress?: string,
  ) {
    const previous = await this.getReceiptSettings();
    const doc =
      (await this.settingsModel.findOne({ key: SHOP_SETTINGS_KEY }).exec()) ??
      new this.settingsModel({ key: SHOP_SETTINGS_KEY });

    if (dto.name !== undefined) {
      doc.name = dto.name;
    }
    if (dto.phone !== undefined) {
      doc.phone = dto.phone;
    }
    if (dto.address !== undefined) {
      doc.address = dto.address;
    }
    if (dto.overdueRepairDays !== undefined) {
      doc.overdueRepairDays = dto.overdueRepairDays;
    }
    if (dto.largeDebtThreshold !== undefined) {
      doc.largeDebtThreshold = dto.largeDebtThreshold;
    }

    await doc.save();
    const next = await this.getReceiptSettings();

    this.auditService.record({
      userId,
      action: AuditAction.SETTINGS_CHANGE,
      entityType: AuditEntityType.SETTINGS,
      entityId: SHOP_SETTINGS_KEY,
      previousValue: previous as unknown as Record<string, unknown>,
      newValue: next as unknown as Record<string, unknown>,
      ipAddress,
    });

    return next;
  }
}
