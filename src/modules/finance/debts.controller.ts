import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { Permission } from '../../common/enums/permission.enum.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import type { UserDocument } from '../users/schemas/user.schema.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { DebtsService } from './debts.service.js';
import { PaymentsService } from './payments.service.js';

@ApiTags('debts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('debts')
export class DebtsController {
  constructor(
    private readonly debtsService: DebtsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get()
  @Permissions(Permission.SALES_READ)
  list(@Query() query: PaginationQueryDto) {
    return this.debtsService.listDebts(query);
  }

  @Post('pay')
  @Permissions(Permission.SALES_MANAGE)
  pay(@Body() dto: CreatePaymentDto, @CurrentUser() user: UserDocument) {
    return this.paymentsService.create(dto, user.id);
  }
}
