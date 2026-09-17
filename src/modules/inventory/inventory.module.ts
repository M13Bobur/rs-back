import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { CatalogServicesController } from './catalog-services.controller.js';
import { CatalogServicesService } from './catalog-services.service.js';
import { InventoryController } from './inventory.controller.js';
import { InventoryOperationsService } from './inventory-operations.service.js';
import { InventoryStockService } from './inventory-stock.service.js';
import { ProductCategoriesController } from './product-categories.controller.js';
import { ProductCategoriesService } from './product-categories.service.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import {
  InventoryMovement,
  InventoryMovementSchema,
} from './schemas/inventory-movement.schema.js';
import {
  ProductCategory,
  ProductCategorySchema,
} from './schemas/product-category.schema.js';
import { Product, ProductSchema } from './schemas/product.schema.js';
import {
  RepairCatalogService,
  RepairCatalogServiceSchema,
} from './schemas/repair-catalog-service.schema.js';
import { AlertsModule } from '../alerts/alerts.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductCategory.name, schema: ProductCategorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: RepairCatalogService.name, schema: RepairCatalogServiceSchema },
      { name: InventoryMovement.name, schema: InventoryMovementSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AlertsModule,
  ],
  controllers: [
    ProductCategoriesController,
    ProductsController,
    CatalogServicesController,
    InventoryController,
  ],
  providers: [
    ProductCategoriesService,
    ProductsService,
    CatalogServicesService,
    InventoryStockService,
    InventoryOperationsService,
  ],
  exports: [
    ProductsService,
    CatalogServicesService,
    InventoryStockService,
  ],
})
export class InventoryModule {}
