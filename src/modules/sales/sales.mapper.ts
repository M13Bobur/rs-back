import type { SaleDocument } from './schemas/sale.schema.js';

function mapSaleItem(item: SaleDocument['items'][number]) {
  const line = item as SaleDocument['items'][number] & {
    _id?: { toString(): string };
  };
  return {
    id: line._id ? String(line._id) : undefined,
    productId: String(item.productId),
    productName: item.productName,
    sku: item.sku,
    barcode: item.barcode,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
    inventoryMovementId: item.inventoryMovementId
      ? String(item.inventoryMovementId)
      : undefined,
  };
}

export function toSaleResponse(sale: SaleDocument) {
  return {
    id: sale.id,
    saleNumber: sale.saleNumber,
    customerId: sale.customerId ? String(sale.customerId) : undefined,
    cashierId: String(sale.cashierId),
    items: sale.items.map(mapSaleItem),
    subtotal: sale.subtotal,
    discount: sale.discount,
    total: sale.total,
    paidAmount: sale.paidAmount,
    remainingAmount: sale.remainingAmount,
    paymentStatus: sale.paymentStatus,
    paymentMethod: sale.paymentMethod,
    status: sale.status,
    createdAt: sale.createdAt,
  };
}

export function toSaleReceipt(
  sale: SaleDocument,
  shop?: { name: string; phone: string; address: string },
) {
  const base = toSaleResponse(sale);
  const shopInfo = shop ?? {
    name: 'Recovery Service',
    phone: '',
    address: '',
  };
  return {
    ...base,
    receipt: {
      shopName: shopInfo.name,
      shopPhone: shopInfo.phone,
      shopAddress: shopInfo.address,
      saleNumber: sale.saleNumber,
      createdAt: sale.createdAt,
      items: base.items,
      subtotal: sale.subtotal,
      discount: sale.discount,
      total: sale.total,
      paidAmount: sale.paidAmount,
      remainingAmount: sale.remainingAmount,
      paymentMethod: sale.paymentMethod,
    },
  };
}
