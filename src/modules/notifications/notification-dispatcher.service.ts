import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { Customer, CustomerDocument } from '../customers/schemas/customer.schema.js';
import { NotificationChannelId } from './enums/notification-channel-id.enum.js';
import { NotificationLogStatus } from './enums/notification-log-status.enum.js';
import type { INotificationChannel } from './interfaces/notification-channel.interface.js';
import type { NotificationDispatchRequest } from './interfaces/notification-message.interface.js';
import {
  NotificationLog,
  NotificationLogDocument,
} from './schemas/notification-log.schema.js';
import { buildNotificationContent } from './templates/notification-templates.js';

export const NOTIFICATION_CHANNELS = 'NOTIFICATION_CHANNELS';

@Injectable()
export class NotificationDispatcherService {
  private readonly logger = new Logger(NotificationDispatcherService.name);

  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(NotificationLog.name)
    private readonly logModel: Model<NotificationLogDocument>,
    @Inject(NOTIFICATION_CHANNELS)
    private readonly channels: INotificationChannel[],
  ) {}

  /** Non-blocking helper for domain services */
  enqueue(request: NotificationDispatchRequest): void {
    void this.dispatch(request).catch((error) => {
      this.logger.error(
        `Notification dispatch failed: ${error instanceof Error ? error.message : error}`,
      );
    });
  }

  async dispatch(request: NotificationDispatchRequest): Promise<void> {
    const customer = await this.customerModel
      .findById(request.customerId)
      .exec();

    const { title, body } = buildNotificationContent(request);
    const preview = `${title}: ${body}`.slice(0, 500);

    const message = {
      type: request.type,
      customerId: request.customerId,
      recipientChatId: customer?.telegramId,
      title,
      body,
      repairId: request.repairId,
      paymentId: request.paymentId,
      metadata: request.context,
    };

    for (const channel of this.channels) {
      if (channel.id !== NotificationChannelId.TELEGRAM) {
        continue;
      }

      if (!channel.isEnabled()) {
        await this.logModel.create({
          type: request.type,
          channel: channel.id,
          status: NotificationLogStatus.SKIPPED,
          customerId: new Types.ObjectId(request.customerId),
          repairId: request.repairId
            ? new Types.ObjectId(request.repairId)
            : undefined,
          paymentId: request.paymentId
            ? new Types.ObjectId(request.paymentId)
            : undefined,
          messagePreview: preview,
          errorMessage: 'Telegram o‘chirilgan',
        });
        continue;
      }

      if (!customer?.telegramId?.trim()) {
        await this.logModel.create({
          type: request.type,
          channel: channel.id,
          status: NotificationLogStatus.SKIPPED,
          customerId: new Types.ObjectId(request.customerId),
          repairId: request.repairId
            ? new Types.ObjectId(request.repairId)
            : undefined,
          paymentId: request.paymentId
            ? new Types.ObjectId(request.paymentId)
            : undefined,
          messagePreview: preview,
          errorMessage: 'Telegram ID yo‘q',
        });
        continue;
      }

      const result = await channel.send(message);
      await this.logModel.create({
        type: request.type,
        channel: channel.id,
        status: result.success
          ? NotificationLogStatus.SENT
          : NotificationLogStatus.FAILED,
        customerId: new Types.ObjectId(request.customerId),
        repairId: request.repairId
          ? new Types.ObjectId(request.repairId)
          : undefined,
        paymentId: request.paymentId
          ? new Types.ObjectId(request.paymentId)
          : undefined,
        recipient: customer.telegramId,
        messagePreview: preview,
        errorMessage: result.errorMessage,
        externalId: result.externalId,
      });
    }
  }
}
