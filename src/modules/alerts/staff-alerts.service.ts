import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { buildPaginationMeta } from '../../common/dto/paginated-response.dto.js';
import { RepairStatus } from '../../common/enums/repair-status.enum.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { RepairOrder, RepairOrderDocument } from '../repairs/schemas/repair-order.schema.js';
import { User, UserDocument } from '../users/schemas/user.schema.js';
import { StaffAlertsQueryDto } from './dto/staff-alerts-query.dto.js';
import { StaffAlertType } from './enums/staff-alert-type.enum.js';
import { StaffAlert, StaffAlertDocument } from './schemas/staff-alert.schema.js';

const NOTIFY_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.MANAGER];

type AlertPayload = {
  type: StaffAlertType;
  title: string;
  body: string;
  href?: string;
  entityType?: string;
  entityId?: string;
};

@Injectable()
export class StaffAlertsService {
  constructor(
    @InjectModel(StaffAlert.name)
    private readonly alertModel: Model<StaffAlertDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(RepairOrder.name)
    private readonly repairModel: Model<RepairOrderDocument>,
  ) {}

  async listForUser(userId: string, query: StaffAlertsQueryDto) {
    const { page, limit, unreadOnly } = query;
    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };
    if (unreadOnly) {
      filter.readAt = { $exists: false };
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.alertModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.alertModel.countDocuments(filter).exec(),
    ]);

    return {
      data: items.map(mapAlert),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async unreadCount(userId: string) {
    const count = await this.alertModel
      .countDocuments({
        userId: new Types.ObjectId(userId),
        readAt: { $exists: false },
      })
      .exec();
    return { count };
  }

  async markRead(userId: string, alertId: string) {
    const alert = await this.alertModel.findById(alertId).exec();
    if (!alert || String(alert.userId) !== userId) {
      throw new NotFoundException('Xabarnoma topilmadi');
    }
    if (!alert.readAt) {
      alert.readAt = new Date();
      await alert.save();
    }
    return mapAlert(alert);
  }

  async markAllRead(userId: string) {
    await this.alertModel
      .updateMany(
        { userId: new Types.ObjectId(userId), readAt: { $exists: false } },
        { $set: { readAt: new Date() } },
      )
      .exec();
    return { success: true };
  }

  notifyStaff(payload: AlertPayload, roles: UserRole[] = NOTIFY_ROLES): void {
    void this.fanOut(payload, roles).catch(() => undefined);
  }

  lowStock(input: {
    productId: string;
    productName: string;
    sku: string;
    stock: number;
    minimumStock: number;
  }) {
    this.notifyStaff({
      type: StaffAlertType.LOW_STOCK,
      title: 'Kam qoldiq',
      body: `${input.productName} (${input.sku}): qoldiq ${input.stock}, minimum ${input.minimumStock}`,
      href: `/inventory/products/${input.productId}`,
      entityType: 'PRODUCT',
      entityId: input.productId,
    });
  }

  repairReady(input: { repairId: string; repairNumber: string }) {
    this.notifyStaff({
      type: StaffAlertType.REPAIR_READY,
      title: 'Ta’mirlash tayyor',
      body: `Buyurtma ${input.repairNumber} mijozga topshirishga tayyor.`,
      href: `/repairs/${input.repairId}`,
      entityType: 'REPAIR',
      entityId: input.repairId,
    });
  }

  approvalRequired(input: {
    repairId: string;
    repairNumber: string;
    amount?: number;
  }) {
    const amountText =
      input.amount != null
        ? ` Taxminiy summa: ${Math.round(input.amount).toLocaleString('uz-UZ')} so‘m.`
        : '';
    this.notifyStaff({
      type: StaffAlertType.APPROVAL_REQUIRED,
      title: 'Mijoz tasdig‘i kerak',
      body: `Buyurtma ${input.repairNumber}: narx tasdiqlanishi kerak.${amountText}`,
      href: `/repairs/${input.repairId}`,
      entityType: 'REPAIR',
      entityId: input.repairId,
    });
  }

  async runScheduledChecks(options: {
    overdueDays: number;
    largeDebtThreshold: number;
  }) {
    await Promise.all([
      this.scanOverdueRepairs(options.overdueDays),
      this.scanLargeDebts(options.largeDebtThreshold),
    ]);
  }

  private async fanOut(payload: AlertPayload, roles: UserRole[]) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const users = await this.userModel
      .find({ role: { $in: roles }, isActive: true })
      .select('_id')
      .exec();

    for (const user of users) {
      if (payload.entityId) {
        const recent = await this.alertModel
          .findOne({
            userId: user._id,
            type: payload.type,
            entityId: payload.entityId,
            createdAt: { $gte: since },
          })
          .exec();
        if (recent) {
          continue;
        }
      }

      await this.alertModel.create({
        userId: user._id,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        href: payload.href,
        entityType: payload.entityType,
        entityId: payload.entityId,
      });
    }
  }

  private async scanOverdueRepairs(overdueDays: number) {
    const cutoff = new Date(Date.now() - overdueDays * 24 * 60 * 60 * 1000);
    const repairs = await this.repairModel
      .find({
        status: {
          $in: [
            RepairStatus.WAITING,
            RepairStatus.IN_PROGRESS,
            RepairStatus.WAITING_CUSTOMER_APPROVAL,
          ],
        },
        updatedAt: { $lte: cutoff },
      })
      .select('_id repairNumber updatedAt')
      .limit(50)
      .exec();

    for (const repair of repairs) {
      this.notifyStaff({
        type: StaffAlertType.OVERDUE_REPAIR,
        title: 'Muddati o‘tgan ta’mirlash',
        body: `Buyurtma ${repair.repairNumber} ${overdueDays} kundan ortiq faol holatda.`,
        href: `/repairs/${repair.id}`,
        entityType: 'REPAIR',
        entityId: repair.id,
      });
    }
  }

  private async scanLargeDebts(threshold: number) {
    const rows = await this.repairModel
      .aggregate<{ _id: Types.ObjectId; total: number }>([
        { $match: { remainingAmount: { $gt: 0 } } },
        {
          $group: {
            _id: '$customerId',
            total: { $sum: '$remainingAmount' },
          },
        },
        { $match: { total: { $gte: threshold } } },
        { $limit: 30 },
      ])
      .exec();

    for (const row of rows) {
      const customerId = String(row._id);
      this.notifyStaff({
        type: StaffAlertType.LARGE_DEBT,
        title: 'Katta qarzdorlik',
        body: `Mijoz qarzi ${Math.round(row.total).toLocaleString('uz-UZ')} so‘m (chegara ${Math.round(threshold).toLocaleString('uz-UZ')} so‘m).`,
        href: `/debts`,
        entityType: 'CUSTOMER',
        entityId: customerId,
      });
    }
  }
}

function mapAlert(alert: StaffAlertDocument) {
  return {
    id: alert.id,
    type: alert.type,
    title: alert.title,
    body: alert.body,
    href: alert.href,
    entityType: alert.entityType,
    entityId: alert.entityId,
    readAt: alert.readAt,
    createdAt: alert.createdAt,
  };
}
