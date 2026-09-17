import { RepairPaymentStatus } from '../../../common/enums/repair-payment-status.enum.js';

export function calculateSaleAmounts(input: {
  subtotal: number;
  discount?: number;
  paidAmount?: number;
}): {
  total: number;
  remainingAmount: number;
  paymentStatus: RepairPaymentStatus;
} {
  const discount = input.discount ?? 0;
  const paidAmount = input.paidAmount ?? 0;
  const total = Math.max(input.subtotal - discount, 0);
  const remainingAmount = Math.max(total - paidAmount, 0);

  let paymentStatus = RepairPaymentStatus.UNPAID;
  if (paidAmount <= 0) {
    paymentStatus = RepairPaymentStatus.UNPAID;
  } else if (remainingAmount <= 0) {
    paymentStatus = RepairPaymentStatus.PAID;
  } else {
    paymentStatus = RepairPaymentStatus.PARTIALLY_PAID;
  }

  return { total, remainingAmount, paymentStatus };
}
