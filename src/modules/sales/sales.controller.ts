import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { Permission } from '../../common/enums/permission.enum.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { CreateSaleDto } from './dto/create-sale.dto.js';
import { SalePaymentDto } from './dto/sale-payment.dto.js';
import { SalesQueryDto } from './dto/sales-query.dto.js';
import type { UserDocument } from '../users/schemas/user.schema.js';
import { SalesService } from './sales.service.js';

@ApiTags('sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @Permissions(Permission.SALES_READ)
  findAll(@Query() query: SalesQueryDto) {
    return this.salesService.findAll(query);
  }

  @Get(':id/audit')
  @Permissions(Permission.SALES_READ)
  audit(@Param('id') id: string) {
    return this.salesService.listAudit(id);
  }

  @Get(':id')
  @Permissions(Permission.SALES_READ)
  findOne(@Param('id') id: string) {
    return this.salesService.findById(id);
  }

  @Post()
  @Permissions(Permission.SALES_MANAGE)
  create(@Body() dto: CreateSaleDto, @CurrentUser() user: UserDocument) {
    return this.salesService.create(dto, user.id);
  }

  @Post(':id/payments')
  @Permissions(Permission.SALES_MANAGE)
  addPayment(
    @Param('id') id: string,
    @Body() dto: SalePaymentDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.salesService.addPayment(id, dto, user.id);
  }

  @Post(':id/cancel')
  @Permissions(Permission.SALES_MANAGE)
  cancel(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: UserDocument,
  ) {
    return this.salesService.cancel(id, user.id, body?.reason);
  }
}
