import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';
import { PaymentMethod } from '../../../common/enums/payment-method.enum.js';
import { RepairPaymentStatus } from '../../../common/enums/repair-payment-status.enum.js';
import { SaleStatus } from '../../../common/enums/sale-status.enum.js';
import { SaleItem, SaleItemSchema } from './sale-item.schema.js';

export type SaleDocument = HydratedDocument<Sale>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Sale {
  @Prop({ type: String, required: true, unique: true, index: true })
  saleNumber!: string;

  @Prop({ type: Types.ObjectId, ref: 'Customer', index: true })
  customerId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  cashierId!: Types.ObjectId;

  @Prop({ type: [SaleItemSchema], default: [] })
  items!: SaleItem[];

  @Prop({ type: Number, required: true, min: 0 })
  subtotal!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  discount!: number;

  @Prop({ type: Number, required: true, min: 0 })
  total!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  paidAmount!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  remainingAmount!: number;

  @Prop({
    type: String,
    enum: RepairPaymentStatus,
    default: RepairPaymentStatus.UNPAID,
  })
  paymentStatus!: RepairPaymentStatus;

  @Prop({ type: String, enum: PaymentMethod, required: true })
  paymentMethod!: PaymentMethod;

  @Prop({
    type: String,
    enum: SaleStatus,
    default: SaleStatus.COMPLETED,
    index: true,
  })
  status!: SaleStatus;

  @Prop({ type: Date, index: true })
  createdAt!: Date;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);
