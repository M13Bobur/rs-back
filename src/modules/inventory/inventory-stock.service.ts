import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type { ClientSession, Connection, Model } from 'mongoose';
import { Types } from 'mongoose';
import { InventoryMovementType } from '../../common/enums/inventory-movement-type.enum.js';
import {
  InventoryMovement,
  InventoryMovementDocument,
} from './schemas/inventory-movement.schema.js';
import { Product, ProductDocument } from './schemas/product.schema.js';
import { AuditAction } from '../audit/enums/audit-action.enum.js';
import { AuditEntityType } from '../audit/enums/audit-entity-type.enum.js';
import { AuditService } from '../audit/audit.service.js';
import { StaffAlertsService } from '../alerts/staff-alerts.service.js';

function stockDelta(type: InventoryMovementType, quantity: number): number {
  switch (type) {
    case InventoryMovementType.IN:
    case InventoryMovementType.RETURN:
      return quantity;
    case InventoryMovementType.OUT:
    case InventoryMovementType.REPAIR_USAGE:
    case InventoryMovementType.SALE:
      return -quantity;
    case InventoryMovementType.ADJUSTMENT:
      return quantity;
    default:
      return quantity;
  }
}

function isTransactionUnsupported(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const code = (error as { code?: number }).code;
  const message = String((error as { message?: string }).message ?? '');
  return (
    code === 20 ||
    message.includes('replica set') ||
    message.includes('Transaction numbers') ||
    message.includes('retryable writes') ||
    message.includes('retryWrites')
  );
}

@Injectable()
export class InventoryStockService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(InventoryMovement.name)
    private readonly movementModel: Model<InventoryMovementDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly auditService: AuditService,
    private readonly staffAlertsService: StaffAlertsService,
  ) {}

  async withTransaction<T>(
    fn: (session?: ClientSession) => Promise<T>,
  ): Promise<T> {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction().catch(() => undefined);
      if (isTransactionUnsupported(error)) {
        return fn(undefined);
      }
      throw error;
    } finally {
      void session.endSession();
    }
  }

  async applyMovement(
    input: {
      productId: string;
      type: InventoryMovementType;
      quantity: number;
      performedBy: string;
      unitCost?: number;
      note?: string;
      repairOrderId?: string;
      repairPartLineId?: string;
      saleId?: string;
    },
    session?: ClientSession,
  ): Promise<{ product: ProductDocument; movement: InventoryMovementDocument }> {
    if (input.quantity === 0) {
      throw new BadRequestException('Miqdor 0 bo‘lishi mumkin emas');
    }

    const delta = stockDelta(input.type, input.quantity);
    const absDecrease = delta < 0 ? Math.abs(delta) : 0;

    const filter: Record<string, unknown> = {
      _id: new Types.ObjectId(input.productId),
    };
    if (absDecrease > 0) {
      filter.stock = { $gte: absDecrease };
    }

    const before = await this.productModel
      .findById(input.productId)
      .session(session ?? null)
      .exec();

    if (!before) {
      throw new NotFoundException('Mahsulot topilmadi');
    }

    const updated = await this.productModel
      .findOneAndUpdate(filter, { $inc: { stock: delta } }, { new: true })
      .session(session ?? null)
      .exec();

    if (!updated) {
      throw new BadRequestException(
        `Omborda yetarli qoldiq yo‘q (${before.name}: ${before.stock})`,
      );
    }

    const stockBefore = before.stock;
    const stockAfter = updated.stock;

    const movement = await this.movementModel.create(
      [
        {
          productId: new Types.ObjectId(input.productId),
          type: input.type,
          quantity: Math.abs(input.quantity),
          stockBefore,
          stockAfter,
          unitCost: input.unitCost,
          repairOrderId: input.repairOrderId
            ? new Types.ObjectId(input.repairOrderId)
            : undefined,
          repairPartLineId: input.repairPartLineId,
          saleId: input.saleId
            ? new Types.ObjectId(input.saleId)
            : undefined,
          note: input.note,
          createdBy: new Types.ObjectId(input.performedBy),
        },
      ],
      session ? { session } : undefined,
    );

    const movementDoc = movement[0]!;

    this.auditService.record({
      userId: input.performedBy,
      action: AuditAction.INVENTORY_CHANGE,
      entityType: AuditEntityType.INVENTORY_MOVEMENT,
      entityId: movementDoc.id,
      previousValue: { stock: stockBefore, productId: input.productId },
      newValue: {
        stock: stockAfter,
        type: input.type,
        quantity: input.quantity,
        productId: input.productId,
      },
    });

    if (
      updated.minimumStock > 0 &&
      updated.stock <= updated.minimumStock
    ) {
      this.staffAlertsService.lowStock({
        productId: updated.id,
        productName: updated.name,
        sku: updated.sku,
        stock: updated.stock,
        minimumStock: updated.minimumStock,
      });
    }

    return { product: updated, movement: movementDoc };
  }
}
