import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { UserDocument } from '../users/schemas/user.schema.js';
import { StaffAlertsQueryDto } from './dto/staff-alerts-query.dto.js';
import { StaffAlertsService } from './staff-alerts.service.js';

@ApiTags('alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class StaffAlertsController {
  constructor(private readonly staffAlertsService: StaffAlertsService) {}

  @Get()
  list(@CurrentUser() user: UserDocument, @Query() query: StaffAlertsQueryDto) {
    return this.staffAlertsService.listForUser(user.id, query);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: UserDocument) {
    return this.staffAlertsService.unreadCount(user.id);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    return this.staffAlertsService.markRead(user.id, id);
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: UserDocument) {
    return this.staffAlertsService.markAllRead(user.id);
  }
}
