import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { CashShiftStatus } from '../../common/enums/cash-shift-status.enum.js';
import { CashTransactionType } from '../../common/enums/cash-transaction-type.enum.js';
import { PaymentMethod } from '../../common/enums/payment-method.enum.js';
import { CloseShiftDto } from './dto/close-shift.dto.js';
import { OpenShiftDto } from './dto/open-shift.dto.js';
import { toShiftResponse } from './finance.mapper.js';
import { CashShift, CashShiftDocument } from './schemas/cash-shift.schema.js';
import {
  CashTransaction,
  CashTransactionDocument,
} from './schemas/cash-transaction.schema.js';

@Injectable()
export class CashShiftService {
  constructor(
    @InjectModel(CashShift.name)
    private readonly shiftModel: Model<CashShiftDocument>,
    @InjectModel(CashTransaction.name)
    private readonly transactionModel: Model<CashTransactionDocument>,
  ) {}

  async getCurrentShift() {
    const shift = await this.shiftModel
      .findOne({ status: CashShiftStatus.OPEN })
      .sort({ openedAt: -1 })
      .exec();
    return shift ? toShiftResponse(shift) : null;
  }

  async requireOpenShiftDocument(): Promise<CashShiftDocument> {
    const shift = await this.shiftModel
      .findOne({ status: CashShiftStatus.OPEN })
      .sort({ openedAt: -1 })
      .exec();
    if (!shift) {
      throw new BadRequestException(
        'Kassa smenasi ochilmagan. Avval smenani oching',
      );
    }
    return shift;
  }

  async openShift(dto: OpenShiftDto, userId: string) {
    const existing = await this.shiftModel
      .findOne({ status: CashShiftStatus.OPEN })
      .exec();
    if (existing) {
      throw new BadRequestException('Faol smena allaqachon ochiq');
    }
    const shift = await this.shiftModel.create({
      openingBalance: dto.openingBalance ?? 0,
      openedBy: userId,
      openedAt: new Date(),
      status: CashShiftStatus.OPEN,
    });
    return toShiftResponse(shift);
  }

  async computeExpectedBalance(shiftId: string): Promise<number> {
    const shift = await this.shiftModel.findById(shiftId).exec();
    if (!shift) {
      throw new NotFoundException('Smena topilmadi');
    }

    const transactions = await this.transactionModel
      .find({ shiftId })
      .exec();

    let cashFlow = 0;
    for (const tx of transactions) {
      const isCash =
        !tx.paymentMethod || tx.paymentMethod === PaymentMethod.CASH;
      if (!isCash && tx.type !== CashTransactionType.EXPENSE) {
        continue;
      }

      if (tx.type === CashTransactionType.EXPENSE) {
        cashFlow -= tx.amount;
      } else if (
        [
          CashTransactionType.INCOME,
          CashTransactionType.REPAIR_PAYMENT,
          CashTransactionType.DEBT_PAYMENT,
          CashTransactionType.SALE,
        ].includes(tx.type)
      ) {
        if (isCash) {
          cashFlow += tx.amount;
        }
      } else if (tx.type === CashTransactionType.REFUND) {
        if (isCash) {
          cashFlow -= tx.amount;
        }
      }
    }

    return shift.openingBalance + cashFlow;
  }

  async closeShift(dto: CloseShiftDto, userId: string) {
    const shift = await this.requireOpenShiftDocument();
    const expectedBalance = await this.computeExpectedBalance(shift.id);
    const difference = dto.actualBalance - expectedBalance;

    shift.status = CashShiftStatus.CLOSED;
    shift.expectedBalance = expectedBalance;
    shift.actualBalance = dto.actualBalance;
    shift.difference = difference;
    shift.closedBy = new Types.ObjectId(userId);
    shift.closedAt = new Date();
    await shift.save();

    return toShiftResponse(shift);
  }
}
