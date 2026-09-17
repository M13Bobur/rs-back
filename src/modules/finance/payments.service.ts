import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { buildPaginationMeta } from '../../common/dto/paginated-response.dto.js';
import { CashTransactionType } from '../../common/enums/cash-transaction-type.enum.js';
import { RepairEventType } from '../../common/enums/repair-event-type.enum.js';
import { RepairOrder, RepairOrderDocument } from '../repairs/schemas/repair-order.schema.js';
import { RepairsService } from '../repairs/repairs.service.js';
import { CashShiftService } from './cash-shift.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { PaymentsQueryDto } from './dto/payments-query.dto.js';
import { toPaymentResponse } from './finance.mapper.js';
import { Payment, PaymentDocument } from './schemas/payment.schema.js';
import {
  CashTransaction,
  CashTransactionDocument,
} from './schemas/cash-transaction.schema.js';
import { RepairNotificationFacade } from '../notifications/repair-notification.facade.js';
import { AuditAction } from '../audit/enums/audit-action.enum.js';
import { AuditEntityType } from '../audit/enums/audit-entity-type.enum.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(CashTransaction.name)
    private readonly transactionModel: Model<CashTransactionDocument>,
    @InjectModel(RepairOrder.name)
    private readonly repairModel: Model<RepairOrderDocument>,
    private readonly cashShiftService: CashShiftService,
    private readonly repairsService: RepairsService,
    private readonly repairNotifications: RepairNotificationFacade,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: PaymentsQueryDto) {
    const { page, limit, customerId, repairId } = query;
    const filter: Record<string, unknown> = {};
    if (customerId) {
      filter.customerId = customerId;
    }
    if (repairId) {
      filter.repairId = repairId;
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.paymentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.paymentModel.countDocuments(filter).exec(),
    ]);
    return {
      data: items.map(toPaymentResponse),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async create(dto: CreatePaymentDto, cashierId: string) {
    const shiftDoc = await this.cashShiftService.requireOpenShiftDocument();
    const shift = { id: shiftDoc.id };

    if (dto.saleId) {
      throw new BadRequestException(
        'Sotuv to‘lovini /sales/:id/payments orqali kiriting',
      );
    }

    let remaining = dto.amount;
    const payments: PaymentDocument[] = [];

    if (dto.repairId) {
      const payment = await this.applyRepairPayment(
        dto,
        cashierId,
        shift?.id,
        dto.repairId,
        dto.amount,
      );
      return toPaymentResponse(payment);
    }

    if (!dto.customerId) {
      throw new BadRequestException('Mijoz talab qilinadi');
    }

    const repairs = await this.repairModel
      .find({
        customerId: dto.customerId,
        remainingAmount: { $gt: 0 },
      })
      .sort({ createdAt: 1 })
      .exec();

    if (!repairs.length) {
      throw new BadRequestException('Mijozda ochiq qarz topilmadi');
    }

    for (const repair of repairs) {
      if (remaining <= 0) {
        break;
      }
      const portion = Math.min(remaining, repair.remainingAmount);
      const payment = await this.applyRepairPayment(
        { ...dto, amount: portion, notes: dto.notes },
        cashierId,
        shift?.id,
        repair.id,
        portion,
        CashTransactionType.DEBT_PAYMENT,
      );
      payments.push(payment);
      remaining -= portion;
    }

    if (remaining > 0) {
      throw new BadRequestException(
        'To‘lov miqdori ochiq qarzdan oshib ketdi',
      );
    }

    return toPaymentResponse(payments[payments.length - 1]!);
  }

  private async applyRepairPayment(
    dto: CreatePaymentDto,
    cashierId: string,
    shiftId: string | undefined,
    repairId: string,
    amount: number,
    txType: CashTransactionType = CashTransactionType.REPAIR_PAYMENT,
  ): Promise<PaymentDocument> {
    const repair = await this.repairModel.findById(repairId).exec();
    if (!repair) {
      throw new NotFoundException('Ta’mirlash buyurtmasi topilmadi');
    }
    if (
      dto.customerId &&
      String(repair.customerId) !== dto.customerId
    ) {
      throw new BadRequestException('Mijoz buyurtmaga mos kelmaydi');
    }
    if (amount > repair.remainingAmount) {
      throw new BadRequestException(
        `To‘lov qoldiqdan oshmasligi kerak (qoldiq: ${repair.remainingAmount})`,
      );
    }

    const payment = await this.paymentModel.create({
      amount,
      paymentMethod: dto.paymentMethod,
      customerId: dto.customerId
        ? new Types.ObjectId(dto.customerId)
        : repair.customerId,
      repairId,
      saleId: dto.saleId ? new Types.ObjectId(dto.saleId) : undefined,
      cashierId,
      notes: dto.notes,
      shiftId: shiftId ? new Types.ObjectId(shiftId) : undefined,
    });

    const effectiveShiftId =
      shiftId ??
      (await this.cashShiftService.requireOpenShiftDocument()).id;

    await this.transactionModel.create({
      type: txType,
      amount,
      paymentMethod: dto.paymentMethod,
      paymentId: payment._id,
      customerId: dto.customerId,
      repairId,
      shiftId: effectiveShiftId,
      cashierId,
      notes: dto.notes,
    });

    repair.paidAmount += amount;
    this.repairsService.syncRepairPricing(repair);
    await repair.save();

    await this.repairsService.recordEventPublic({
      repairOrderId: repair.id,
      eventType: RepairEventType.UPDATED,
      note: `To‘lov qabul qilindi: ${amount} (${dto.paymentMethod})`,
      performedBy: cashierId,
    });

    this.repairNotifications.paymentReceived({
      customerId: String(payment.customerId),
      paymentId: payment.id,
      amount,
      repairId: repair.id,
      repairNumber: repair.repairNumber,
      remainingAmount: repair.remainingAmount,
    });

    this.auditService.record({
      userId: cashierId,
      action: AuditAction.PAYMENT,
      entityType: AuditEntityType.PAYMENT,
      entityId: payment.id,
      newValue: {
        amount,
        paymentMethod: dto.paymentMethod,
        repairId: repair.id,
        customerId: String(payment.customerId),
        remainingAmount: repair.remainingAmount,
      },
    });

    return payment;
  }
}
