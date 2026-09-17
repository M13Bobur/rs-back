import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, required: true, trim: true, unique: true, index: true })
  sku!: string;

  @Prop({ type: String, trim: true })
  barcode?: string;

  @Prop({ type: Types.ObjectId, ref: 'ProductCategory', index: true })
  categoryId?: Types.ObjectId;

  @Prop({ type: String, trim: true })
  brand?: string;

  @Prop({ type: [String], default: [] })
  compatibleModels!: string[];

  @Prop({ type: Number, default: 0, min: 0 })
  purchasePrice!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  salePrice!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  stock!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  minimumStock!: number;

  @Prop({ type: String, trim: true })
  supplierId?: string;

  @Prop({ type: String, trim: true })
  location?: string;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({ type: Boolean, default: true, index: true })
  isActive!: boolean;

  @Prop({ type: Date })
  createdAt!: Date;

  @Prop({ type: Date })
  updatedAt!: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ name: 'text', sku: 'text', barcode: 'text' });
ProductSchema.index({ barcode: 1 }, { unique: true, sparse: true });
