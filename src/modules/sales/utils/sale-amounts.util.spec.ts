import { RepairPaymentStatus } from '../../../common/enums/repair-payment-status.enum.js';
import { calculateSaleAmounts } from './sale-amounts.util.js';

describe('calculateSaleAmounts', () => {
  it('computes total after discount', () => {
    expect(calculateSaleAmounts({ subtotal: 100_000, discount: 10_000 }).total).toBe(
      90_000,
    );
  });

  it('marks partial payment', () => {
    const result = calculateSaleAmounts({
      subtotal: 100_000,
      paidAmount: 40_000,
    });
    expect(result.remainingAmount).toBe(60_000);
    expect(result.paymentStatus).toBe(RepairPaymentStatus.PARTIALLY_PAID);
  });

  it('marks paid when fully covered', () => {
    const result = calculateSaleAmounts({
      subtotal: 50_000,
      paidAmount: 50_000,
    });
    expect(result.remainingAmount).toBe(0);
    expect(result.paymentStatus).toBe(RepairPaymentStatus.PAID);
  });
});
