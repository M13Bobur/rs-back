import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { buildPaginationMeta } from '../../common/dto/paginated-response.dto.js';
import { InventoryMovementType } from '../../common/enums/inventory-movement-type.enum.js';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto.js';
import { MovementsQueryDto } from './dto/movements-query.dto.js';
import { ReceiveInventoryDto } from './dto/receive-inventory.dto.js';
import { InventoryStockService } from './inventory-stock.service.js';
import { toMovementResponse, toProductResponse } from './inventory.mapper.js';
import {
  InventoryMovement,
  InventoryMovementDocument,
} from './schemas/inventory-movement.schema.js';

@Injectable()
export class InventoryOperationsService {
  constructor(
    private readonly stockService: InventoryStockService,
    @InjectModel(InventoryMovement.name)
    private readonly movementModel: Model<InventoryMovementDocument>,
  ) {}

  async receive(dto: ReceiveInventoryDto, performedBy: string) {
    const result = await this.stockService.withTransaction((session) =>
      this.stockService.applyMovement(
        {
          productId: dto.productId,
          type: InventoryMovementType.IN,
          quantity: dto.quantity,
          unitCost: dto.unitCost,
          note: dto.note,
          performedBy,
        },
        session,
      ),
    );
    return {
      product: toProductResponse(result.product),
      movement: toMovementResponse(result.movement),
    };
  }

  async adjust(dto: AdjustInventoryDto, performedBy: string) {
    const result = await this.stockService.withTransaction((session) =>
      this.stockService.applyMovement(
        {
          productId: dto.productId,
          type: InventoryMovementType.ADJUSTMENT,
          quantity: dto.quantityChange,
          note: dto.note,
          performedBy,
        },
        session,
      ),
    );
    return {
      product: toProductResponse(result.product),
      movement: toMovementResponse(result.movement),
    };
  }

  async listMovements(query: MovementsQueryDto) {
    const { page, limit, productId, type } = query;
    const filter: Record<string, unknown> = {};
    if (productId) {
      filter.productId = productId;
    }
    if (type) {
      filter.type = type;
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.movementModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.movementModel.countDocuments(filter).exec(),
    ]);
    return {
      data: items.map(toMovementResponse),
      meta: buildPaginationMeta(page, limit, total),
    };
  }
}
