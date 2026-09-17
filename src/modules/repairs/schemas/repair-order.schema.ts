import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';
import { RepairApprovalStatus } from '../../../common/enums/repair-approval-status.enum.js';
import { RepairPaymentStatus } from '../../../common/enums/repair-payment-status.enum.js';
import { RepairStatus } from '../../../common/enums/repair-status.enum.js';
import {
  AccessoriesChecklist,
  AccessoriesChecklistSchema,
  PhysicalConditionChecklist,
  PhysicalConditionChecklistSchema,
  ReceptionChecklist,
  ReceptionChecklistSchema,
  RepairDiagnostics,
  RepairDiagnosticsSchema,
  RepairPhoto,
  RepairPhotoSchema,
} from './repair-reception.schema.js';
import {
  RepairOrderPartLine,
  RepairOrderPartLineSchema,
  RepairOrderServiceLine,
  RepairOrderServiceLineSchema,
} from './repair-order-billing.schema.js';

export type RepairOrderDocument = HydratedDocument<RepairOrder>;

@Schema({ timestamps: true })
export class RepairOrder {
  @Prop({ type: String, required: true, unique: true, index: true })
  repairNumber!: string;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true })
  customerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Phone', required: true, index: true })
  phoneId!: Types.ObjectId;

  @Prop({ type: String, trim: true, index: true })
  imei?: string;

  @Prop({ type: String, required: true, trim: true })
  reportedProblem!: string;

  @Prop({ type: String, trim: true })
  initialCondition?: string;

  @Prop({ type: String, trim: true })
  diagnosticResult?: string;

  @Prop({ type: String, trim: true })
  repairDescription?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  assignedTechnicianId?: Types.ObjectId;

  @Prop({ type: Number, default: 0, min: 0 })
  estimatedPrice!: number;

  @Prop({ type: Number, min: 0 })
  finalPrice?: number;

  @Prop({ type: Number, default: 0, min: 0 })
  discount!: number;

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

  @Prop({
    type: String,
    enum: RepairStatus,
    default: RepairStatus.WAITING,
    index: true,
  })
  status!: RepairStatus;

  @Prop({ type: String, trim: true })
  customerNotes?: string;

  @Prop({ type: String, trim: true })
  internalNotes?: string;

  @Prop({
    type: String,
    enum: RepairApprovalStatus,
    default: RepairApprovalStatus.NOT_REQUIRED,
  })
  approvalStatus!: RepairApprovalStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deliveredBy?: Types.ObjectId;

  @Prop({ type: Date })
  deliveredAt?: Date;

  @Prop({ type: ReceptionChecklistSchema, default: {} })
  receptionChecklist!: ReceptionChecklist;

  @Prop({ type: PhysicalConditionChecklistSchema, default: {} })
  physicalConditionChecklist!: PhysicalConditionChecklist;

  @Prop({ type: AccessoriesChecklistSchema, default: {} })
  accessoriesChecklist!: AccessoriesChecklist;

  @Prop({ type: [RepairPhotoSchema], default: [] })
  photos!: RepairPhoto[];

  @Prop({ type: RepairDiagnosticsSchema, default: {} })
  diagnostics!: RepairDiagnostics;

  @Prop({ type: [RepairOrderServiceLineSchema], default: [] })
  orderServices!: RepairOrderServiceLine[];

  @Prop({ type: [RepairOrderPartLineSchema], default: [] })
  orderParts!: RepairOrderPartLine[];

  @Prop({ type: Number, default: 0, min: 0 })
  servicesTotal!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  partsTotal!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  laborAmount!: number;

  @Prop({ type: Date, index: true })
  createdAt!: Date;

  @Prop({ type: Date })
  updatedAt!: Date;
}

export const RepairOrderSchema = SchemaFactory.createForClass(RepairOrder);

RepairOrderSchema.index({ createdAt: -1 });
