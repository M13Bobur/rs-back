import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema.js';
import { RepairOrder, RepairOrderSchema } from '../repairs/schemas/repair-order.schema.js';
import { TelegramNotificationChannel } from './channels/telegram-notification.channel.js';
import {
  NOTIFICATION_CHANNELS,
  NotificationDispatcherService,
} from './notification-dispatcher.service.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { RepairNotificationFacade } from './repair-notification.facade.js';
import {
  NotificationLog,
  NotificationLogSchema,
} from './schemas/notification-log.schema.js';
import type { INotificationChannel } from './interfaces/notification-channel.interface.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationLog.name, schema: NotificationLogSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: RepairOrder.name, schema: RepairOrderSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [NotificationsController],
  providers: [
    TelegramNotificationChannel,
    {
      provide: NOTIFICATION_CHANNELS,
      useFactory: (telegram: TelegramNotificationChannel): INotificationChannel[] => [
        telegram,
      ],
      inject: [TelegramNotificationChannel],
    },
    NotificationDispatcherService,
    RepairNotificationFacade,
    NotificationsService,
  ],
  exports: [RepairNotificationFacade],
})
export class NotificationsModule {}
