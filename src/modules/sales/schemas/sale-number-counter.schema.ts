import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type SaleNumberCounterDocument = HydratedDocument<SaleNumberCounter>;

@Schema({ collection: 'sale_number_counters' })
export class SaleNumberCounter {
  @Prop({ type: Number, required: true, unique: true })
  year!: number;

  @Prop({ type: Number, required: true, default: 0 })
  seq!: number;
}

export const SaleNumberCounterSchema =
  SchemaFactory.createForClass(SaleNumberCounter);
