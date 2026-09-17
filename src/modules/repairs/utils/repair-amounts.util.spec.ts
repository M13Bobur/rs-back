import { RepairPaymentStatus } from '../../../common/enums/repair-payment-status.enum.js';
import { calculateRepairAmounts } from './repair-amounts.util.js';

describe('calculateRepairAmounts', () => {
  it('calculates remaining and paid status', () => {
    const result = calculateRepairAmounts({
      estimatedPrice: 100000,
      finalPrice: 120000,
      discount: 20000,
      paidAmount: 50000,
    });

    expect(result.remainingAmount).toBe(50000);
    expect(result.paymentStatus).toBe(RepairPaymentStatus.PARTIALLY_PAID);
  });

  it('marks as paid when balance is zero', () => {
    const result = calculateRepairAmounts({
      finalPrice: 100000,
      paidAmount: 100000,
    });

    expect(result.remainingAmount).toBe(0);
    expect(result.paymentStatus).toBe(RepairPaymentStatus.PAID);
  });
});
