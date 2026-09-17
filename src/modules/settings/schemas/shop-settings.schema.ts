import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type ShopSettingsDocument = HydratedDocument<ShopSettings>;

export const SHOP_SETTINGS_KEY = 'default';

@Schema({ timestamps: true })
export class ShopSettings {
  @Prop({ type: String, required: true, unique: true, default: SHOP_SETTINGS_KEY })
  key!: string;

  @Prop({ type: String, trim: true })
  name?: string;

  @Prop({ type: String, trim: true })
  phone?: string;

  @Prop({ type: String, trim: true })
  address?: string;

  @Prop({ type: Number, min: 1, default: 7 })
  overdueRepairDays!: number;

  @Prop({ type: Number, min: 0, default: 5_000_000 })
  largeDebtThreshold!: number;

  @Prop({ type: Date })
  updatedAt!: Date;
}

export const ShopSettingsSchema = SchemaFactory.createForClass(ShopSettings);
