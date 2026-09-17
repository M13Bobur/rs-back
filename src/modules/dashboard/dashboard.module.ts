import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Product, ProductSchema } from '../inventory/schemas/product.schema.js';
import { RepairOrder, RepairOrderSchema } from '../repairs/schemas/repair-order.schema.js';
import { ReportsModule } from '../reports/reports.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  imports: [
    ReportsModule,
    MongooseModule.forFeature([
      { name: RepairOrder.name, schema: RepairOrderSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
