import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';
import { StaffAlertType } from '../enums/staff-alert-type.enum.js';

export type StaffAlertDocument = HydratedDocument<StaffAlert>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class StaffAlert {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: StaffAlertType, required: true, index: true })
  type!: StaffAlertType;

  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: String, required: true, trim: true })
  body!: string;

  @Prop({ type: String, trim: true })
  href?: string;

  @Prop({ type: String, index: true })
  entityType?: string;

  @Prop({ type: String, index: true })
  entityId?: string;

  @Prop({ type: Date, index: true })
  readAt?: Date;

  @Prop({ type: Date })
  createdAt!: Date;
}

export const StaffAlertSchema = SchemaFactory.createForClass(StaffAlert);

StaffAlertSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
StaffAlertSchema.index(
  { userId: 1, type: 1, entityId: 1, createdAt: -1 },
  { name: 'staff_alert_dedupe' },
);
