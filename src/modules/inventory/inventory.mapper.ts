import type { ProductCategoryDocument } from './schemas/product-category.schema.js';
import type { ProductDocument } from './schemas/product.schema.js';
import type { RepairCatalogServiceDocument } from './schemas/repair-catalog-service.schema.js';
import type { InventoryMovementDocument } from './schemas/inventory-movement.schema.js';

export function toCategoryResponse(category: ProductCategoryDocument) {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

export function toProductResponse(product: ProductDocument) {
  const lowStock = product.stock <= product.minimumStock;
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    categoryId: product.categoryId ? String(product.categoryId) : undefined,
    brand: product.brand,
    compatibleModels: product.compatibleModels ?? [],
    purchasePrice: product.purchasePrice,
    salePrice: product.salePrice,
    stock: product.stock,
    minimumStock: product.minimumStock,
    supplierId: product.supplierId,
    location: product.location,
    description: product.description,
    images: product.images ?? [],
    isActive: product.isActive,
    lowStock,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function toCatalogServiceResponse(service: RepairCatalogServiceDocument) {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    defaultPrice: service.defaultPrice,
    category: service.category,
    isActive: service.isActive,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}

export function toMovementResponse(movement: InventoryMovementDocument) {
  return {
    id: movement.id,
    productId: String(movement.productId),
    type: movement.type,
    quantity: movement.quantity,
    stockBefore: movement.stockBefore,
    stockAfter: movement.stockAfter,
    unitCost: movement.unitCost,
    repairOrderId: movement.repairOrderId
      ? String(movement.repairOrderId)
      : undefined,
    repairPartLineId: movement.repairPartLineId,
    note: movement.note,
    createdBy: String(movement.createdBy),
    createdAt: movement.createdAt,
  };
}
