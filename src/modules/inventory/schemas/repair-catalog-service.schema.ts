import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type RepairCatalogServiceDocument =
  HydratedDocument<RepairCatalogService>;

@Schema({ timestamps: true, collection: 'repair_catalog_services' })
export class RepairCatalogService {
  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: Number, default: 0, min: 0 })
  defaultPrice!: number;

  @Prop({ type: String, trim: true })
  category?: string;

  @Prop({ type: Boolean, default: true, index: true })
  isActive!: boolean;

  @Prop({ type: Date })
  createdAt!: Date;

  @Prop({ type: Date })
  updatedAt!: Date;
}

export const RepairCatalogServiceSchema = SchemaFactory.createForClass(
  RepairCatalogService,
);
