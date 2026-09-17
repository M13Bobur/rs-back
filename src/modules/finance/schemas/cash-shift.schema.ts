import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';
import { CashShiftStatus } from '../../../common/enums/cash-shift-status.enum.js';

export type CashShiftDocument = HydratedDocument<CashShift>;

@Schema({ timestamps: true })
export class CashShift {
  @Prop({
    type: String,
    enum: CashShiftStatus,
    default: CashShiftStatus.OPEN,
    index: true,
  })
  status!: CashShiftStatus;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  openingBalance!: number;

  @Prop({ type: Number, min: 0 })
  expectedBalance?: number;

  @Prop({ type: Number, min: 0 })
  actualBalance?: number;

  @Prop({ type: Number })
  difference?: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  openedBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  closedBy?: Types.ObjectId;

  @Prop({ type: Date, index: true })
  openedAt!: Date;

  @Prop({ type: Date })
  closedAt?: Date;

  @Prop({ type: Date })
  createdAt!: Date;

  @Prop({ type: Date })
  updatedAt!: Date;
}

export const CashShiftSchema = SchemaFactory.createForClass(CashShift);
