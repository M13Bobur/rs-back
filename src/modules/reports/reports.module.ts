import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { CashShiftService } from '../finance/cash-shift.service.js';
import {
  CashShift,
  CashShiftSchema,
} from '../finance/schemas/cash-shift.schema.js';
import {
  CashTransaction,
  CashTransactionSchema,
} from '../finance/schemas/cash-transaction.schema.js';
import { Expense, ExpenseSchema } from '../finance/schemas/expense.schema.js';
import { Payment, PaymentSchema } from '../finance/schemas/payment.schema.js';
import {
  InventoryMovement,
  InventoryMovementSchema,
} from '../inventory/schemas/inventory-movement.schema.js';
import { Product, ProductSchema } from '../inventory/schemas/product.schema.js';
import { RepairOrder, RepairOrderSchema } from '../repairs/schemas/repair-order.schema.js';
import { Sale, SaleSchema } from '../sales/schemas/sale.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Expense.name, schema: ExpenseSchema },
      { name: CashTransaction.name, schema: CashTransactionSchema },
      { name: CashShift.name, schema: CashShiftSchema },
      { name: Sale.name, schema: SaleSchema },
      { name: RepairOrder.name, schema: RepairOrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: InventoryMovement.name, schema: InventoryMovementSchema },
      { name: User.name, schema: UserSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, CashShiftService],
  exports: [ReportsService],
})
export class ReportsModule {}
