import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema.js';
import { Phone, PhoneSchema } from '../phones/schemas/phone.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { AlertsModule } from '../alerts/alerts.module.js';
import { RepairsController } from './repairs.controller.js';
import { RepairBillingService } from './repair-billing.service.js';
import { RepairsService } from './repairs.service.js';
import { RepairHistory, RepairHistorySchema } from './schemas/repair-history.schema.js';
import {
  RepairNumberCounter,
  RepairNumberCounterSchema,
} from './schemas/repair-number-counter.schema.js';
import { RepairOrder, RepairOrderSchema } from './schemas/repair-order.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RepairOrder.name, schema: RepairOrderSchema },
      { name: RepairHistory.name, schema: RepairHistorySchema },
      { name: RepairNumberCounter.name, schema: RepairNumberCounterSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Phone.name, schema: PhoneSchema },
      { name: User.name, schema: UserSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    InventoryModule,
    NotificationsModule,
    AlertsModule,
  ],
  controllers: [RepairsController],
  providers: [RepairsService, RepairBillingService],
  exports: [RepairsService],
})
export class RepairsModule {}
