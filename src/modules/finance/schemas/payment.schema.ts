import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';
import { PaymentMethod } from '../../../common/enums/payment-method.enum.js';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Payment {
  @Prop({ type: Number, required: true, min: 1 })
  amount!: number;

  @Prop({ type: String, enum: PaymentMethod, required: true })
  paymentMethod!: PaymentMethod;

  @Prop({ type: Types.ObjectId, ref: 'Customer', index: true })
  customerId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'RepairOrder', index: true })
  repairId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Sale', index: true })
  saleId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  cashierId!: Types.ObjectId;

  @Prop({ type: String, trim: true })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: 'CashShift', index: true })
  shiftId?: Types.ObjectId;

  @Prop({ type: Date, index: true })
  createdAt!: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
