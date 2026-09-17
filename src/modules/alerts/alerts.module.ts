import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { RepairOrder, RepairOrderSchema } from '../repairs/schemas/repair-order.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { StaffAlertsController } from './staff-alerts.controller.js';
import { StaffAlertsScheduler } from './staff-alerts.scheduler.js';
import { StaffAlertsService } from './staff-alerts.service.js';
import { StaffAlert, StaffAlertSchema } from './schemas/staff-alert.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StaffAlert.name, schema: StaffAlertSchema },
      { name: User.name, schema: UserSchema },
      { name: RepairOrder.name, schema: RepairOrderSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [StaffAlertsController],
  providers: [StaffAlertsService, StaffAlertsScheduler],
  exports: [StaffAlertsService],
})
export class AlertsModule {}
