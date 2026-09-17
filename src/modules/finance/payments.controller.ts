import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { Permission } from '../../common/enums/permission.enum.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import type { UserDocument } from '../users/schemas/user.schema.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { PaymentsQueryDto } from './dto/payments-query.dto.js';
import { PaymentsService } from './payments.service.js';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @Permissions(Permission.SALES_READ)
  findAll(@Query() query: PaymentsQueryDto) {
    return this.paymentsService.findAll(query);
  }

  @Post()
  @Permissions(Permission.SALES_MANAGE)
  create(@Body() dto: CreatePaymentDto, @CurrentUser() user: UserDocument) {
    return this.paymentsService.create(dto, user.id);
  }
}
