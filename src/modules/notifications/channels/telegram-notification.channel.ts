import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationChannelId } from '../enums/notification-channel-id.enum.js';
import type {
  INotificationChannel,
  NotificationSendResult,
} from '../interfaces/notification-channel.interface.js';
import type { NotificationMessage } from '../interfaces/notification-message.interface.js';

@Injectable()
export class TelegramNotificationChannel implements INotificationChannel {
  readonly id = NotificationChannelId.TELEGRAM;
  private readonly logger = new Logger(TelegramNotificationChannel.name);

  constructor(private readonly configService: ConfigService) {}

  isEnabled(): boolean {
    return (
      this.configService.get<boolean>('telegram.enabled') === true &&
      Boolean(this.configService.get<string>('telegram.botToken'))
    );
  }

  async send(message: NotificationMessage): Promise<NotificationSendResult> {
    if (!this.isEnabled()) {
      return {
        success: false,
        errorMessage: 'Telegram o‘chirilgan yoki token yo‘q',
      };
    }

    if (!message.recipientChatId) {
      return {
        success: false,
        errorMessage: 'Mijozda Telegram ID yo‘q',
      };
    }

    const token = this.configService.getOrThrow<string>('telegram.botToken');
    const text = `${message.title}\n\n${message.body}`;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: message.recipientChatId,
          text,
        }),
        signal: AbortSignal.timeout(15_000),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        description?: string;
        result?: { message_id?: number };
      };

      if (!response.ok || !payload.ok) {
        const err = payload.description ?? `HTTP ${response.status}`;
        this.logger.warn(`Telegram send failed: ${err}`);
        return { success: false, errorMessage: err };
      }

      return {
        success: true,
        externalId: payload.result?.message_id
          ? String(payload.result.message_id)
          : undefined,
      };
    } catch (error) {
      const err = error instanceof Error ? error.message : 'Telegram xatosi';
      this.logger.warn(`Telegram send error: ${err}`);
      return { success: false, errorMessage: err };
    }
  }
}
