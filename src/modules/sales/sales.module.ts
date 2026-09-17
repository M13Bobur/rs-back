import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import {
  CashTransaction,
  CashTransactionSchema,
} from '../finance/schemas/cash-transaction.schema.js';
import { Payment, PaymentSchema } from '../finance/schemas/payment.schema.js';
import { CashShiftService } from '../finance/cash-shift.service.js';
import {
  CashShift,
  CashShiftSchema,
} from '../finance/schemas/cash-shift.schema.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { SalesController } from './sales.controller.js';
import { SalesService } from './sales.service.js';
import { SaleAudit, SaleAuditSchema } from './schemas/sale-audit.schema.js';
import {
  SaleNumberCounter,
  SaleNumberCounterSchema,
} from './schemas/sale-number-counter.schema.js';
import { Sale, SaleSchema } from './schemas/sale.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sale.name, schema: SaleSchema },
      { name: SaleNumberCounter.name, schema: SaleNumberCounterSchema },
      { name: SaleAudit.name, schema: SaleAuditSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: CashTransaction.name, schema: CashTransactionSchema },
      { name: CashShift.name, schema: CashShiftSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    InventoryModule,
  ],
  controllers: [SalesController],
  providers: [SalesService, CashShiftService],
})
export class SalesModule {}
