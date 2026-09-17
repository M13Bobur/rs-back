import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { Permission } from '../../common/enums/permission.enum.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { NotificationsService } from './notifications.service.js';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('logs')
  @Permissions(Permission.REPORTS_VIEW)
  listLogs(@Query() query: PaginationQueryDto) {
    return this.notificationsService.listLogs(query);
  }

  @Post('debt-reminder/:customerId')
  @Permissions(Permission.SALES_MANAGE)
  debtReminder(@Param('customerId') customerId: string) {
    return this.notificationsService.sendDebtReminder(customerId);
  }
}
