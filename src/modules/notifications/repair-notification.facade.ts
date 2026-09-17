import { Injectable } from '@nestjs/common';
import { RepairStatus } from '../../common/enums/repair-status.enum.js';
import { NotificationType } from './enums/notification-type.enum.js';
import { NotificationDispatcherService } from './notification-dispatcher.service.js';

/** Thin facade so repair/finance code does not depend on Telegram details. */
@Injectable()
export class RepairNotificationFacade {
  constructor(
    private readonly dispatcher: NotificationDispatcherService,
  ) {}

  repairAccepted(input: {
    customerId: string;
    repairId: string;
    repairNumber: string;
  }) {
    this.dispatcher.enqueue({
      type: NotificationType.REPAIR_ACCEPTED,
      customerId: input.customerId,
      repairId: input.repairId,
      context: { repairNumber: input.repairNumber },
    });
  }

  diagnosisCompleted(input: {
    customerId: string;
    repairId: string;
    repairNumber: string;
  }) {
    this.dispatcher.enqueue({
      type: NotificationType.DIAGNOSIS_COMPLETED,
      customerId: input.customerId,
      repairId: input.repairId,
      context: { repairNumber: input.repairNumber },
    });
  }

  statusChanged(input: {
    customerId: string;
    repairId: string;
    repairNumber: string;
    fromStatus: RepairStatus;
    toStatus: RepairStatus;
    estimatedTotal?: number;
  }) {
    const ctx = {
      repairNumber: input.repairNumber,
      amount: input.estimatedTotal,
    };

    if (input.toStatus === RepairStatus.WAITING_CUSTOMER_APPROVAL) {
      this.dispatcher.enqueue({
        type: NotificationType.PRICE_APPROVAL_REQUIRED,
        customerId: input.customerId,
        repairId: input.repairId,
        context: ctx,
      });
      return;
    }

    if (input.toStatus === RepairStatus.IN_PROGRESS) {
      const type =
        input.fromStatus === RepairStatus.WAITING_CUSTOMER_APPROVAL
          ? NotificationType.REPAIR_APPROVED
          : NotificationType.REPAIR_STARTED;
      this.dispatcher.enqueue({
        type,
        customerId: input.customerId,
        repairId: input.repairId,
        context: ctx,
      });
      return;
    }

    if (input.toStatus === RepairStatus.READY) {
      this.dispatcher.enqueue({
        type: NotificationType.REPAIR_READY,
        customerId: input.customerId,
        repairId: input.repairId,
        context: ctx,
      });
      return;
    }

    if (input.toStatus === RepairStatus.DELIVERED) {
      this.dispatcher.enqueue({
        type: NotificationType.REPAIR_DELIVERED,
        customerId: input.customerId,
        repairId: input.repairId,
        context: ctx,
      });
    }
  }

  paymentReceived(input: {
    customerId: string;
    paymentId: string;
    amount: number;
    repairId?: string;
    repairNumber?: string;
    remainingAmount?: number;
  }) {
    this.dispatcher.enqueue({
      type: NotificationType.PAYMENT_RECEIVED,
      customerId: input.customerId,
      paymentId: input.paymentId,
      repairId: input.repairId,
      context: {
        amount: input.amount,
        repairNumber: input.repairNumber,
        remainingAmount: input.remainingAmount,
      },
    });
  }

  debtReminder(input: {
    customerId: string;
    remainingAmount: number;
  }) {
    this.dispatcher.enqueue({
      type: NotificationType.DEBT_REMINDER,
      customerId: input.customerId,
      context: { remainingAmount: input.remainingAmount },
    });
  }
}
