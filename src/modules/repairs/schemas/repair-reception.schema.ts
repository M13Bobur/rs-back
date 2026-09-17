import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { RepairPhotoType } from '../../../common/enums/repair-photo-type.enum.js';

@Schema({ _id: false })
export class ReceptionChecklist {
  @Prop({ type: Boolean }) screenWorking?: boolean;
  @Prop({ type: Boolean }) touchWorking?: boolean;
  @Prop({ type: Boolean }) faceId?: boolean;
  @Prop({ type: Boolean }) fingerprint?: boolean;
  @Prop({ type: Boolean }) frontCamera?: boolean;
  @Prop({ type: Boolean }) rearCamera?: boolean;
  @Prop({ type: Boolean }) flash?: boolean;
  @Prop({ type: Boolean }) speaker?: boolean;
  @Prop({ type: Boolean }) microphone?: boolean;
  @Prop({ type: Boolean }) vibration?: boolean;
  @Prop({ type: Boolean }) charging?: boolean;
  @Prop({ type: Boolean }) wifi?: boolean;
  @Prop({ type: Boolean }) bluetooth?: boolean;
  @Prop({ type: Boolean }) sim?: boolean;
  @Prop({ type: Boolean }) mobileNetwork?: boolean;
  @Prop({ type: Boolean }) buttons?: boolean;
  @Prop({ type: Boolean }) proximitySensor?: boolean;
}

export const ReceptionChecklistSchema =
  SchemaFactory.createForClass(ReceptionChecklist);

@Schema({ _id: false })
export class PhysicalConditionChecklist {
  @Prop({ type: Boolean }) screenCracked?: boolean;
  @Prop({ type: Boolean }) backGlassCracked?: boolean;
  @Prop({ type: Boolean }) frameDamaged?: boolean;
  @Prop({ type: Boolean }) cameraGlassDamaged?: boolean;
  @Prop({ type: Boolean }) scratches?: boolean;
  @Prop({ type: Boolean }) waterDamage?: boolean;
  @Prop({ type: Boolean }) missingParts?: boolean;
  @Prop({ type: String, trim: true }) other?: string;
}

export const PhysicalConditionChecklistSchema = SchemaFactory.createForClass(
  PhysicalConditionChecklist,
);

@Schema({ _id: false })
export class AccessoriesChecklist {
  @Prop({ type: Boolean }) charger?: boolean;
  @Prop({ type: Boolean }) cable?: boolean;
  @Prop({ type: Boolean }) simCard?: boolean;
  @Prop({ type: Boolean }) simTray?: boolean;
  @Prop({ type: Boolean }) case?: boolean;
  @Prop({ type: Boolean }) memoryCard?: boolean;
  @Prop({ type: String, trim: true }) other?: string;
}

export const AccessoriesChecklistSchema =
  SchemaFactory.createForClass(AccessoriesChecklist);

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class RepairPhoto {
  @Prop({ type: String, enum: RepairPhotoType, required: true })
  type!: RepairPhotoType;

  @Prop({ type: String, required: true })
  filename!: string;

  @Prop({ type: String, required: true })
  originalName!: string;

  @Prop({ type: String, required: true })
  mimeType!: string;

  @Prop({ type: Number, required: true })
  size!: number;

  @Prop({ type: String, required: true })
  url!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy!: Types.ObjectId;

  @Prop({ type: Date })
  createdAt!: Date;
}

export const RepairPhotoSchema = SchemaFactory.createForClass(RepairPhoto);

@Schema({ _id: false })
export class RepairDiagnostics {
  @Prop({ type: String, trim: true })
  diagnosticResult?: string;

  @Prop({ type: String, trim: true })
  requiredRepairs?: string;

  @Prop({ type: String, trim: true })
  requiredParts?: string;

  @Prop({ type: Number, min: 0 })
  estimatedLabor?: number;

  @Prop({ type: Number, min: 0 })
  estimatedTotal?: number;

  @Prop({ type: String, trim: true })
  diagnosticNotes?: string;
}

export const RepairDiagnosticsSchema =
  SchemaFactory.createForClass(RepairDiagnostics);
