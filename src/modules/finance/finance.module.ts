import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema.js';
import { RepairsModule } from '../repairs/repairs.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { RepairOrder, RepairOrderSchema } from '../repairs/schemas/repair-order.schema.js';
import { CashRegisterController } from './cash-register.controller.js';
import { CashShiftService } from './cash-shift.service.js';
import { DebtsController } from './debts.controller.js';
import { DebtsService } from './debts.service.js';
import { ExpensesController } from './expenses.controller.js';
import { ExpensesService } from './expenses.service.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { CashShift, CashShiftSchema } from './schemas/cash-shift.schema.js';
import {
  CashTransaction,
  CashTransactionSchema,
} from './schemas/cash-transaction.schema.js';
import { Expense, ExpenseSchema } from './schemas/expense.schema.js';
import { Payment, PaymentSchema } from './schemas/payment.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: CashTransaction.name, schema: CashTransactionSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: CashShift.name, schema: CashShiftSchema },
      { name: RepairOrder.name, schema: RepairOrderSchema },
      { name: Customer.name, schema: CustomerSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    RepairsModule,
    NotificationsModule,
  ],
  controllers: [
    PaymentsController,
    DebtsController,
    ExpensesController,
    CashRegisterController,
  ],
  providers: [
    PaymentsService,
    ExpensesService,
    DebtsService,
    CashShiftService,
  ],
})
export class FinanceModule {}
