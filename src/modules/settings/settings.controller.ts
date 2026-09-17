import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { Permission } from '../../common/enums/permission.enum.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { extractClientIp } from '../audit/utils/client-ip.util.js';
import type { UserDocument } from '../users/schemas/user.schema.js';
import { UpdateShopSettingsDto } from './dto/update-shop-settings.dto.js';
import { SettingsService } from './settings.service.js';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('receipt')
  async getReceiptSettings() {
    const settings = await this.settingsService.getReceiptSettings();
    return { shop: settings.shop };
  }

  @Patch('shop')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions(Permission.USERS_UPDATE)
  updateShop(
    @Body() dto: UpdateShopSettingsDto,
    @CurrentUser() user: UserDocument,
    @Req() req: Request,
  ) {
    return this.settingsService.updateShopSettings(
      dto,
      user.id,
      extractClientIp(req),
    );
  }
}
