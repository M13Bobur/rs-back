import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';
import { AuditAction } from '../enums/audit-action.enum.js';
import { AuditEntityType } from '../enums/audit-entity-type.enum.js';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId?: Types.ObjectId;

  @Prop({ type: String, enum: AuditAction, required: true, index: true })
  action!: AuditAction;

  @Prop({ type: String, enum: AuditEntityType, required: true, index: true })
  entityType!: AuditEntityType;

  @Prop({ type: String, index: true })
  entityId?: string;

  @Prop({ type: Object })
  previousValue?: Record<string, unknown>;

  @Prop({ type: Object })
  newValue?: Record<string, unknown>;

  @Prop({ type: String, trim: true })
  ipAddress?: string;

  @Prop({ type: Date })
  createdAt!: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
