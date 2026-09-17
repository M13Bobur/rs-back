import { RepairPaymentStatus } from '../../../common/enums/repair-payment-status.enum.js';

export function calculateRepairAmounts(input: {
  estimatedPrice?: number;
  finalPrice?: number;
  discount?: number;
  paidAmount?: number;
}): { remainingAmount: number; paymentStatus: RepairPaymentStatus } {
  const estimatedPrice = input.estimatedPrice ?? 0;
  const finalPrice = input.finalPrice ?? estimatedPrice;
  const discount = input.discount ?? 0;
  const paidAmount = input.paidAmount ?? 0;

  const totalDue = Math.max(finalPrice - discount, 0);
  const remainingAmount = Math.max(totalDue - paidAmount, 0);

  let paymentStatus = RepairPaymentStatus.UNPAID;
  if (paidAmount <= 0) {
    paymentStatus = RepairPaymentStatus.UNPAID;
  } else if (remainingAmount <= 0) {
    paymentStatus = RepairPaymentStatus.PAID;
  } else {
    paymentStatus = RepairPaymentStatus.PARTIALLY_PAID;
  }

  return { remainingAmount, paymentStatus };
}
