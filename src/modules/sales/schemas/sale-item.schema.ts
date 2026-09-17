import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ _id: true, timestamps: false })
export class SaleItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  productName!: string;

  @Prop({ type: String, trim: true })
  sku?: string;

  @Prop({ type: String, trim: true })
  barcode?: string;

  @Prop({ type: Number, required: true, min: 1 })
  quantity!: number;

  @Prop({ type: Number, required: true, min: 0 })
  unitPrice!: number;

  @Prop({ type: Number, required: true, min: 0 })
  lineTotal!: number;

  @Prop({ type: Types.ObjectId, ref: 'InventoryMovement' })
  inventoryMovementId?: Types.ObjectId;
}

export const SaleItemSchema = SchemaFactory.createForClass(SaleItem);
