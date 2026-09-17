import type { RepairOrder } from '../schemas/repair-order.schema.js';
import { calculateRepairAmounts } from './repair-amounts.util.js';

export function sumServiceLines(
  services: RepairOrder['orderServices'] | undefined,
): number {
  return (services ?? []).reduce((sum, line) => sum + (line.lineTotal ?? 0), 0);
}

export function sumPartLines(
  parts: RepairOrder['orderParts'] | undefined,
): number {
  return (parts ?? []).reduce((sum, line) => sum + (line.lineTotal ?? 0), 0);
}

export function applyRepairPricing(repair: {
  orderServices?: RepairOrder['orderServices'];
  orderParts?: RepairOrder['orderParts'];
  diagnostics?: RepairOrder['diagnostics'];
  laborAmount?: number;
  estimatedPrice?: number;
  discount?: number;
  paidAmount?: number;
  finalPrice?: number;
}): {
  servicesTotal: number;
  partsTotal: number;
  laborAmount: number;
  finalPrice: number;
  remainingAmount: number;
  paymentStatus: ReturnType<typeof calculateRepairAmounts>['paymentStatus'];
} {
  const servicesTotal = sumServiceLines(repair.orderServices);
  const partsTotal = sumPartLines(repair.orderParts);
  const laborAmount =
    repair.laborAmount ??
    repair.diagnostics?.estimatedLabor ??
    0;
  const computedSubtotal = servicesTotal + partsTotal + laborAmount;
  const hasLineItems =
    (repair.orderServices?.length ?? 0) > 0 ||
    (repair.orderParts?.length ?? 0) > 0;
  const finalPrice =
    hasLineItems || laborAmount > 0
      ? computedSubtotal
      : (repair.finalPrice ?? repair.estimatedPrice ?? 0);
  const amounts = calculateRepairAmounts({
    estimatedPrice: finalPrice,
    finalPrice,
    discount: repair.discount,
    paidAmount: repair.paidAmount,
  });

  return {
    servicesTotal,
    partsTotal,
    laborAmount,
    finalPrice,
    remainingAmount: amounts.remainingAmount,
    paymentStatus: amounts.paymentStatus,
  };
}
