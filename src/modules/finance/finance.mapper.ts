import type { CashShiftDocument } from './schemas/cash-shift.schema.js';
import type { CashTransactionDocument } from './schemas/cash-transaction.schema.js';
import type { ExpenseDocument } from './schemas/expense.schema.js';
import type { PaymentDocument } from './schemas/payment.schema.js';

export function toPaymentResponse(payment: PaymentDocument) {
  return {
    id: payment.id,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    customerId: payment.customerId ? String(payment.customerId) : undefined,
    repairId: payment.repairId ? String(payment.repairId) : undefined,
    saleId: payment.saleId ? String(payment.saleId) : undefined,
    cashierId: String(payment.cashierId),
    notes: payment.notes,
    shiftId: payment.shiftId ? String(payment.shiftId) : undefined,
    createdAt: payment.createdAt,
  };
}

export function toExpenseResponse(expense: ExpenseDocument) {
  return {
    id: expense.id,
    category: expense.category,
    amount: expense.amount,
    description: expense.description,
    cashierId: String(expense.cashierId),
    shiftId: String(expense.shiftId),
    createdAt: expense.createdAt,
  };
}

export function toCashTransactionResponse(tx: CashTransactionDocument) {
  return {
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    paymentMethod: tx.paymentMethod,
    paymentId: tx.paymentId ? String(tx.paymentId) : undefined,
    expenseId: tx.expenseId ? String(tx.expenseId) : undefined,
    customerId: tx.customerId ? String(tx.customerId) : undefined,
    repairId: tx.repairId ? String(tx.repairId) : undefined,
    saleId: tx.saleId ? String(tx.saleId) : undefined,
    shiftId: String(tx.shiftId),
    cashierId: String(tx.cashierId),
    notes: tx.notes,
    createdAt: tx.createdAt,
  };
}

export function toShiftResponse(shift: CashShiftDocument) {
  return {
    id: shift.id,
    status: shift.status,
    openingBalance: shift.openingBalance,
    expectedBalance: shift.expectedBalance,
    actualBalance: shift.actualBalance,
    difference: shift.difference,
    openedBy: String(shift.openedBy),
    closedBy: shift.closedBy ? String(shift.closedBy) : undefined,
    openedAt: shift.openedAt,
    closedAt: shift.closedAt,
    createdAt: shift.createdAt,
    updatedAt: shift.updatedAt,
  };
}
