import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';
import { RepairEventType } from '../../../common/enums/repair-event-type.enum.js';
import { RepairStatus } from '../../../common/enums/repair-status.enum.js';

export type RepairHistoryDocument = HydratedDocument<RepairHistory>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class RepairHistory {
  @Prop({ type: Types.ObjectId, ref: 'RepairOrder', required: true, index: true })
  repairOrderId!: Types.ObjectId;

  @Prop({ type: String, enum: RepairEventType, required: true })
  eventType!: RepairEventType;

  @Prop({ type: String, enum: RepairStatus })
  fromStatus?: RepairStatus;

  @Prop({ type: String, enum: RepairStatus })
  toStatus?: RepairStatus;

  @Prop({ type: String, trim: true })
  note?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  performedBy!: Types.ObjectId;

  @Prop({ type: Date })
  createdAt!: Date;
}

export const RepairHistorySchema = SchemaFactory.createForClass(RepairHistory);
