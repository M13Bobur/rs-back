import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export enum SaleAuditEventType {
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  PAYMENT = 'PAYMENT',
}

export type SaleAuditDocument = HydratedDocument<SaleAudit>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class SaleAudit {
  @Prop({ type: Types.ObjectId, ref: 'Sale', required: true, index: true })
  saleId!: Types.ObjectId;

  @Prop({ type: String, enum: SaleAuditEventType, required: true })
  eventType!: SaleAuditEventType;

  @Prop({ type: String, trim: true })
  note?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  performedBy!: Types.ObjectId;

  @Prop({ type: Date })
  createdAt!: Date;
}

export const SaleAuditSchema = SchemaFactory.createForClass(SaleAudit);
