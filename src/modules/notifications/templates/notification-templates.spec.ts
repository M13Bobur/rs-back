import { NotificationType } from '../enums/notification-type.enum.js';
import { buildNotificationContent } from './notification-templates.js';

describe('buildNotificationContent', () => {
  it('builds repair accepted message', () => {
    const { title, body } = buildNotificationContent({
      type: NotificationType.REPAIR_ACCEPTED,
      customerId: '507f1f77bcf86cd799439011',
      context: { repairNumber: 'R-001' },
    });
    expect(title).toBe('Qabul qilindi');
    expect(body).toContain('R-001');
  });

  it('formats price approval with UZS', () => {
    const { body } = buildNotificationContent({
      type: NotificationType.PRICE_APPROVAL_REQUIRED,
      customerId: '507f1f77bcf86cd799439011',
      context: { repairNumber: 'R-002', amount: 500_000 },
    });
    expect(body).toContain('500');
    expect(body).toContain('so‘m');
  });
});
