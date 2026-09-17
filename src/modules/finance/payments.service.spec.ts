import { calculateRepairAmounts } from '../repairs/utils/repair-amounts.util.js';
import { RepairPaymentStatus } from '../../common/enums/repair-payment-status.enum.js';

describe('partial repair payments', () => {
  it('calculates remaining after partial payment', () => {
    const totalDue = 820_000;
    const afterFirst = calculateRepairAmounts({
      finalPrice: totalDue,
      discount: 0,
      paidAmount: 300_000,
    });
    expect(afterFirst.remainingAmount).toBe(520_000);
    expect(afterFirst.paymentStatus).toBe(RepairPaymentStatus.PARTIALLY_PAID);

    const afterFull = calculateRepairAmounts({
      finalPrice: totalDue,
      discount: 0,
      paidAmount: 820_000,
    });
    expect(afterFull.remainingAmount).toBe(0);
    expect(afterFull.paymentStatus).toBe(RepairPaymentStatus.PAID);
  });
});
