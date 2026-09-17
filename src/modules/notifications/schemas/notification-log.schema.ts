import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';
import { NotificationChannelId } from '../enums/notification-channel-id.enum.js';
import { NotificationLogStatus } from '../enums/notification-log-status.enum.js';
import { NotificationType } from '../enums/notification-type.enum.js';

export type NotificationLogDocument = HydratedDocument<NotificationLog>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class NotificationLog {
  @Prop({ type: String, enum: NotificationType, required: true, index: true })
  type!: NotificationType;

  @Prop({ type: String, enum: NotificationChannelId, required: true, index: true })
  channel!: NotificationChannelId;

  @Prop({ type: String, enum: NotificationLogStatus, required: true, index: true })
  status!: NotificationLogStatus;

  @Prop({ type: Types.ObjectId, ref: 'Customer', index: true })
  customerId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'RepairOrder', index: true })
  repairId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Payment', index: true })
  paymentId?: Types.ObjectId;

  @Prop({ type: String, trim: true })
  recipient?: string;

  @Prop({ type: String, trim: true })
  messagePreview?: string;

  @Prop({ type: String, trim: true })
  errorMessage?: string;

  @Prop({ type: String, trim: true })
  externalId?: string;

  @Prop({ type: Date, index: true })
  createdAt!: Date;
}

export const NotificationLogSchema =
  SchemaFactory.createForClass(NotificationLog);
