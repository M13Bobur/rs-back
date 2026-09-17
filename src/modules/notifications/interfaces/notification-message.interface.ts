import type { NotificationType } from '../enums/notification-type.enum.js';

export interface NotificationMessage {
  type: NotificationType;
  customerId: string;
  recipientChatId?: string;
  title: string;
  body: string;
  repairId?: string;
  paymentId?: string;
  metadata?: Record<string, string | number | undefined>;
}

export interface NotificationDispatchRequest {
  type: NotificationType;
  customerId: string;
  repairId?: string;
  paymentId?: string;
  context?: Record<string, string | number | undefined>;
}
