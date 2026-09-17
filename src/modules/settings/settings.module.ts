import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { SettingsController } from './settings.controller.js';
import { SettingsService } from './settings.service.js';
import {
  ShopSettings,
  ShopSettingsSchema,
} from './schemas/shop-settings.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShopSettings.name, schema: ShopSettingsSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
