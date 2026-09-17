import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { Permission } from '../../common/enums/permission.enum.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import type { UserDocument } from '../users/schemas/user.schema.js';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto.js';
import { MovementsQueryDto } from './dto/movements-query.dto.js';
import { ReceiveInventoryDto } from './dto/receive-inventory.dto.js';
import { InventoryOperationsService } from './inventory-operations.service.js';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly operationsService: InventoryOperationsService,
  ) {}

  @Get('movements')
  @Permissions(Permission.INVENTORY_READ)
  listMovements(@Query() query: MovementsQueryDto) {
    return this.operationsService.listMovements(query);
  }

  @Post('receive')
  @Permissions(Permission.INVENTORY_MANAGE)
  receive(
    @Body() dto: ReceiveInventoryDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.operationsService.receive(dto, user.id);
  }

  @Post('adjust')
  @Permissions(Permission.INVENTORY_MANAGE)
  adjust(
    @Body() dto: AdjustInventoryDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.operationsService.adjust(dto, user.id);
  }
}
