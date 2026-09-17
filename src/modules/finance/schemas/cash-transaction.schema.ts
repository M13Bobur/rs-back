import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';
import { CashTransactionType } from '../../../common/enums/cash-transaction-type.enum.js';
import { PaymentMethod } from '../../../common/enums/payment-method.enum.js';

export type CashTransactionDocument = HydratedDocument<CashTransaction>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class CashTransaction {
  @Prop({ type: String, enum: CashTransactionType, required: true, index: true })
  type!: CashTransactionType;

  @Prop({ type: Number, required: true, min: 0 })
  amount!: number;

  @Prop({ type: String, enum: PaymentMethod })
  paymentMethod?: PaymentMethod;

  @Prop({ type: Types.ObjectId, ref: 'Payment', index: true })
  paymentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Expense', index: true })
  expenseId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Customer', index: true })
  customerId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'RepairOrder', index: true })
  repairId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Sale', index: true })
  saleId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CashShift', required: true, index: true })
  shiftId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  cashierId!: Types.ObjectId;

  @Prop({ type: String, trim: true })
  notes?: string;

  @Prop({ type: Date, index: true })
  createdAt!: Date;
}

export const CashTransactionSchema =
  SchemaFactory.createForClass(CashTransaction);
