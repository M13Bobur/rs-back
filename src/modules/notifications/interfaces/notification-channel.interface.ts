import type { NotificationMessage } from './notification-message.interface.js';

export interface NotificationSendResult {
  success: boolean;
  externalId?: string;
  errorMessage?: string;
}

export interface INotificationChannel {
  readonly id: string;
  isEnabled(): boolean;
  send(message: NotificationMessage): Promise<NotificationSendResult>;
}
