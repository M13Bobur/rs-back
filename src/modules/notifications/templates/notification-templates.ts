import { NotificationType } from '../enums/notification-type.enum.js';
import type { NotificationDispatchRequest } from '../interfaces/notification-message.interface.js';

function formatUzs(amount: number | undefined): string {
  if (amount == null || Number.isNaN(amount)) {
    return '—';
  }
  return `${Math.round(amount).toLocaleString('uz-UZ')} so‘m`;
}

export function buildNotificationContent(
  request: NotificationDispatchRequest,
): { title: string; body: string } {
  const ctx = request.context ?? {};
  const repairNumber = String(ctx.repairNumber ?? '—');
  const amount = ctx.amount as number | undefined;
  const remaining = ctx.remainingAmount as number | undefined;

  switch (request.type) {
    case NotificationType.REPAIR_ACCEPTED:
      return {
        title: 'Qabul qilindi',
        body: `Buyurtmangiz qabul qilindi.\nRaqam: ${repairNumber}\nHolat: kutish.`,
      };
    case NotificationType.DIAGNOSIS_COMPLETED:
      return {
        title: 'Diagnostika yakunlandi',
        body: `Buyurtma ${repairNumber}: diagnostika yakunlandi. Tez orada narx bo‘yicha ma’lumot beramiz.`,
      };
    case NotificationType.PRICE_APPROVAL_REQUIRED:
      return {
        title: 'Narxni tasdiqlash kerak',
        body: `Buyurtma ${repairNumber}: ta’mirlash narxi ${formatUzs(amount)}. Tasdiqlash uchun do‘konga murojaat qiling.`,
      };
    case NotificationType.REPAIR_APPROVED:
      return {
        title: 'Ta’mirlash tasdiqlandi',
        body: `Buyurtma ${repairNumber}: siz ta’mirlashni tasdiqladingiz. Ish boshlanadi.`,
      };
    case NotificationType.REPAIR_STARTED:
      return {
        title: 'Ta’mirlash boshlandi',
        body: `Buyurtma ${repairNumber}: ta’mirlash jarayoni boshlandi.`,
      };
    case NotificationType.REPAIR_READY:
      return {
        title: 'Tayyor',
        body: `Buyurtma ${repairNumber}: telefoningiz tayyor. Olib ketishingiz mumkin.`,
      };
    case NotificationType.REPAIR_DELIVERED:
      return {
        title: 'Topshirildi',
        body: `Buyurtma ${repairNumber}: telefon topshirildi. Rahmat!`,
      };
    case NotificationType.PAYMENT_RECEIVED:
      return {
        title: 'To‘lov qabul qilindi',
        body: `To‘lov: ${formatUzs(amount)}${repairNumber !== '—' ? `\nBuyurtma: ${repairNumber}` : ''}${remaining != null ? `\nQoldiq: ${formatUzs(remaining)}` : ''}`,
      };
    case NotificationType.DEBT_REMINDER:
      return {
        title: 'Qarz eslatmasi',
        body: `Hurmatli mijoz, ochiq qarzingiz: ${formatUzs(remaining ?? amount)}. Iltimos, to‘lovni amalga oshiring.`,
      };
    default:
      return { title: 'Xabar', body: 'Yangi bildirishnoma.' };
  }
}
