import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { buildPaginationMeta } from '../../common/dto/paginated-response.dto.js';
import { CashTransactionType } from '../../common/enums/cash-transaction-type.enum.js';
import { PaymentMethod } from '../../common/enums/payment-method.enum.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { CashShiftService } from './cash-shift.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { toExpenseResponse } from './finance.mapper.js';
import { Expense, ExpenseDocument } from './schemas/expense.schema.js';
import {
  CashTransaction,
  CashTransactionDocument,
} from './schemas/cash-transaction.schema.js';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>,
    @InjectModel(CashTransaction.name)
    private readonly transactionModel: Model<CashTransactionDocument>,
    private readonly cashShiftService: CashShiftService,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.expenseModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.expenseModel.countDocuments().exec(),
    ]);
    return {
      data: items.map(toExpenseResponse),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async create(dto: CreateExpenseDto, cashierId: string) {
    const shift = await this.cashShiftService.requireOpenShiftDocument();
    const expense = await this.expenseModel.create({
      category: dto.category,
      amount: dto.amount,
      description: dto.description,
      cashierId,
      shiftId: shift._id,
    });

    await this.transactionModel.create({
      type: CashTransactionType.EXPENSE,
      amount: dto.amount,
      paymentMethod: PaymentMethod.CASH,
      expenseId: expense._id,
      shiftId: shift._id,
      cashierId,
      notes: dto.description,
    });

    return toExpenseResponse(expense);
  }
}
