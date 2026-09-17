import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';
import { ExpenseCategory } from '../../../common/enums/expense-category.enum.js';

export type ExpenseDocument = HydratedDocument<Expense>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Expense {
  @Prop({ type: String, enum: ExpenseCategory, required: true })
  category!: ExpenseCategory;

  @Prop({ type: Number, required: true, min: 1 })
  amount!: number;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  cashierId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CashShift', required: true, index: true })
  shiftId!: Types.ObjectId;

  @Prop({ type: Date, index: true })
  createdAt!: Date;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
