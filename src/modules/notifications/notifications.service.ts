import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { buildPaginationMeta } from '../../common/dto/paginated-response.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { RepairOrder, RepairOrderDocument } from '../repairs/schemas/repair-order.schema.js';
import {
  NotificationLog,
  NotificationLogDocument,
} from './schemas/notification-log.schema.js';
import { RepairNotificationFacade } from './repair-notification.facade.js';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(NotificationLog.name)
    private readonly logModel: Model<NotificationLogDocument>,
    @InjectModel(RepairOrder.name)
    private readonly repairModel: Model<RepairOrderDocument>,
    private readonly repairNotifications: RepairNotificationFacade,
  ) {}

  async listLogs(query: PaginationQueryDto) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.logModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.logModel.countDocuments().exec(),
    ]);

    return {
      data: items.map((log) => ({
        id: log.id,
        type: log.type,
        channel: log.channel,
        status: log.status,
        customerId: log.customerId ? String(log.customerId) : undefined,
        repairId: log.repairId ? String(log.repairId) : undefined,
        paymentId: log.paymentId ? String(log.paymentId) : undefined,
        recipient: log.recipient,
        messagePreview: log.messagePreview,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt,
      })),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async sendDebtReminder(customerId: string) {
    const remaining = await this.repairModel
      .aggregate<{ total: number }>([
        {
          $match: {
            customerId: new Types.ObjectId(customerId),
            remainingAmount: { $gt: 0 },
          },
        },
        { $group: { _id: null, total: { $sum: '$remainingAmount' } } },
      ])
      .exec();

    const amount = remaining[0]?.total ?? 0;
    if (amount <= 0) {
      throw new NotFoundException('Mijozda ochiq qarz topilmadi');
    }

    this.repairNotifications.debtReminder({
      customerId,
      remainingAmount: amount,
    });

    return { queued: true, remainingAmount: amount };
  }
}
