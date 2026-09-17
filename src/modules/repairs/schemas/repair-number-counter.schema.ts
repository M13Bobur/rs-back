import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type RepairNumberCounterDocument = HydratedDocument<RepairNumberCounter>;

@Schema({ collection: 'repair_number_counters' })
export class RepairNumberCounter {
  @Prop({ type: Number, required: true, unique: true })
  year!: number;

  @Prop({ type: Number, required: true, default: 0 })
  seq!: number;
}

export const RepairNumberCounterSchema =
  SchemaFactory.createForClass(RepairNumberCounter);
