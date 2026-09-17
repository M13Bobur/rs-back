import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export type PhoneDocument = HydratedDocument<Phone>;

@Schema({ timestamps: true })
export class Phone {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customerId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  brand!: string;

  @Prop({ type: String, required: true, trim: true, index: true })
  model!: string;

  @Prop({ type: String, trim: true, sparse: true, unique: true })
  imei?: string;

  @Prop({ type: String, trim: true })
  serialNumber?: string;

  @Prop({ type: String, trim: true })
  color?: string;

  @Prop({ type: String, trim: true })
  storage?: string;

  @Prop({ type: Number, min: 0, max: 100 })
  batteryHealth?: number;

  @Prop({ type: String, trim: true })
  notes?: string;

  @Prop({ type: Date })
  createdAt!: Date;

  @Prop({ type: Date })
  updatedAt!: Date;
}

export const PhoneSchema = SchemaFactory.createForClass(Phone);

PhoneSchema.index({ customerId: 1 });
PhoneSchema.index({ model: 'text', imei: 'text', brand: 'text' });
