import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class RepairOrderServiceLine {
  @Prop({ type: Types.ObjectId, ref: 'RepairCatalogService', required: true })
  serviceId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  serviceName!: string;

  @Prop({ type: Number, required: true, min: 1, default: 1 })
  quantity!: number;

  @Prop({ type: Number, required: true, min: 0 })
  unitPrice!: number;

  @Prop({ type: Number, required: true, min: 0 })
  lineTotal!: number;
}

export const RepairOrderServiceLineSchema = SchemaFactory.createForClass(
  RepairOrderServiceLine,
);

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class RepairOrderPartLine {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  productName!: string;

  @Prop({ type: String, trim: true })
  sku?: string;

  @Prop({ type: Number, required: true, min: 1, default: 1 })
  quantity!: number;

  @Prop({ type: Number, required: true, min: 0 })
  unitPrice!: number;

  @Prop({ type: Number, required: true, min: 0 })
  lineTotal!: number;

  @Prop({ type: Types.ObjectId, ref: 'InventoryMovement' })
  inventoryMovementId?: Types.ObjectId;
}

export const RepairOrderPartLineSchema =
  SchemaFactory.createForClass(RepairOrderPartLine);
