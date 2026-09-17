import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';
import { InventoryMovementType } from '../../../common/enums/inventory-movement-type.enum.js';

export type InventoryMovementDocument = HydratedDocument<InventoryMovement>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class InventoryMovement {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true, index: true })
  productId!: Types.ObjectId;

  @Prop({ type: String, enum: InventoryMovementType, required: true, index: true })
  type!: InventoryMovementType;

  @Prop({ type: Number, required: true })
  quantity!: number;

  @Prop({ type: Number, required: true, min: 0 })
  stockBefore!: number;

  @Prop({ type: Number, required: true, min: 0 })
  stockAfter!: number;

  @Prop({ type: Number, min: 0 })
  unitCost?: number;

  @Prop({ type: Types.ObjectId, ref: 'RepairOrder', index: true })
  repairOrderId?: Types.ObjectId;

  @Prop({ type: String, trim: true })
  repairPartLineId?: string;

  @Prop({ type: Types.ObjectId, ref: 'Sale', index: true })
  saleId?: Types.ObjectId;

  @Prop({ type: String, trim: true })
  note?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Date, index: true })
  createdAt!: Date;
}

export const InventoryMovementSchema =
  SchemaFactory.createForClass(InventoryMovement);

InventoryMovementSchema.index({ createdAt: -1 });
