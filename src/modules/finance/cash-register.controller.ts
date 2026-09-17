import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { Permission } from '../../common/enums/permission.enum.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import type { UserDocument } from '../users/schemas/user.schema.js';
import { CashShiftService } from './cash-shift.service.js';
import { CloseShiftDto } from './dto/close-shift.dto.js';
import { OpenShiftDto } from './dto/open-shift.dto.js';

@ApiTags('cash-register')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('cash-register')
export class CashRegisterController {
  constructor(private readonly cashShiftService: CashShiftService) {}

  @Get('current')
  @Permissions(Permission.SALES_READ)
  async getCurrent() {
    const shift = await this.cashShiftService.getCurrentShift();
    if (!shift) {
      return { shift: null, expectedBalance: 0 };
    }
    const expectedBalance = await this.cashShiftService.computeExpectedBalance(
      shift.id,
    );
    return { shift, expectedBalance };
  }

  @Post('open')
  @Permissions(Permission.SALES_MANAGE)
  open(@Body() dto: OpenShiftDto, @CurrentUser() user: UserDocument) {
    return this.cashShiftService.openShift(dto, user.id);
  }

  @Post('close')
  @Permissions(Permission.SALES_MANAGE)
  close(@Body() dto: CloseShiftDto, @CurrentUser() user: UserDocument) {
    return this.cashShiftService.closeShift(dto, user.id);
  }
}
