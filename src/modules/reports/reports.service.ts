import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { CashTransactionType } from '../../common/enums/cash-transaction-type.enum.js';
import { InventoryMovementType } from '../../common/enums/inventory-movement-type.enum.js';
import { PaymentMethod } from '../../common/enums/payment-method.enum.js';
import { RepairStatus } from '../../common/enums/repair-status.enum.js';
import { SaleStatus } from '../../common/enums/sale-status.enum.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { CashShiftService } from '../finance/cash-shift.service.js';
import {
  CashTransaction,
  CashTransactionDocument,
} from '../finance/schemas/cash-transaction.schema.js';
import { Expense, ExpenseDocument } from '../finance/schemas/expense.schema.js';
import { Payment, PaymentDocument } from '../finance/schemas/payment.schema.js';
import {
  InventoryMovement,
  InventoryMovementDocument,
} from '../inventory/schemas/inventory-movement.schema.js';
import { Product, ProductDocument } from '../inventory/schemas/product.schema.js';
import { RepairOrder, RepairOrderDocument } from '../repairs/schemas/repair-order.schema.js';
import { Sale, SaleDocument } from '../sales/schemas/sale.schema.js';
import { User, UserDocument } from '../users/schemas/user.schema.js';
import {
  monthBounds,
  parseDayBounds,
  resolveRange,
  todayDateString,
} from './utils/report-date.util.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>,
    @InjectModel(CashTransaction.name)
    private readonly cashTxModel: Model<CashTransactionDocument>,
    @InjectModel(Sale.name)
    private readonly saleModel: Model<SaleDocument>,
    @InjectModel(RepairOrder.name)
    private readonly repairModel: Model<RepairOrderDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(InventoryMovement.name)
    private readonly movementModel: Model<InventoryMovementDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly cashShiftService: CashShiftService,
  ) {}

  async getDailyReport(date?: string) {
    const day = date ?? todayDateString();
    const { start, end } = parseDayBounds(day);

    const [
      salesAgg,
      repairPaymentsAgg,
      allPaymentsAgg,
      expensesAgg,
      debtPaymentsAgg,
      cashDayAgg,
    ] = await Promise.all([
      this.saleModel
        .aggregate<{ total: number; count: number }>([
          {
            $match: {
              status: SaleStatus.COMPLETED,
              createdAt: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$total' },
              count: { $sum: 1 },
            },
          },
        ])
        .exec(),
      this.paymentModel
        .aggregate<{ total: number }>([
          {
            $match: {
              repairId: { $exists: true, $ne: null },
              createdAt: { $gte: start, $lte: end },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ])
        .exec(),
      this.paymentModel
        .aggregate<{ total: number; count: number }>([
          { $match: { createdAt: { $gte: start, $lte: end } } },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
        ])
        .exec(),
      this.expenseModel
        .aggregate<{ total: number }>([
          { $match: { createdAt: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ])
        .exec(),
      this.cashTxModel
        .aggregate<{ total: number }>([
          {
            $match: {
              type: CashTransactionType.DEBT_PAYMENT,
              createdAt: { $gte: start, $lte: end },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ])
        .exec(),
      this.cashTxModel
        .aggregate<{ inflow: number; outflow: number }>([
          { $match: { createdAt: { $gte: start, $lte: end } } },
          {
            $group: {
              _id: null,
              inflow: {
                $sum: {
                  $cond: [
                    {
                      $in: [
                        '$type',
                        [
                          CashTransactionType.SALE,
                          CashTransactionType.REPAIR_PAYMENT,
                          CashTransactionType.DEBT_PAYMENT,
                          CashTransactionType.INCOME,
                        ],
                      ],
                    },
                    {
                      $cond: [
                        {
                          $or: [
                            { $eq: ['$paymentMethod', PaymentMethod.CASH] },
                            { $eq: ['$paymentMethod', null] },
                            { $not: ['$paymentMethod'] },
                          ],
                        },
                        '$amount',
                        0,
                      ],
                    },
                    0,
                  ],
                },
              },
              outflow: {
                $sum: {
                  $cond: [
                    {
                      $or: [
                        { $eq: ['$type', CashTransactionType.EXPENSE] },
                        { $eq: ['$type', CashTransactionType.REFUND] },
                      ],
                    },
                    '$amount',
                    0,
                  ],
                },
              },
            },
          },
        ])
        .exec(),
    ]);

    const salesTotal = salesAgg[0]?.total ?? 0;
    const repairRevenue = repairPaymentsAgg[0]?.total ?? 0;
    const paymentsTotal = allPaymentsAgg[0]?.total ?? 0;
    const expensesTotal = expensesAgg[0]?.total ?? 0;
    const debtPayments = debtPaymentsAgg[0]?.total ?? 0;
    const cashInflow = cashDayAgg[0]?.inflow ?? 0;
    const cashOutflow = cashDayAgg[0]?.outflow ?? 0;
    const profit = paymentsTotal - expensesTotal;

    let cashBalance: number | null = null;
    try {
      const shift = await this.cashShiftService.getCurrentShift();
      if (shift) {
        cashBalance = await this.cashShiftService.computeExpectedBalance(
          shift.id,
        );
      }
    } catch {
      cashBalance = null;
    }

    return {
      date: day,
      period: { start, end },
      sales: { total: salesTotal, count: salesAgg[0]?.count ?? 0 },
      repairRevenue,
      payments: {
        total: paymentsTotal,
        count: allPaymentsAgg[0]?.count ?? 0,
      },
      expenses: expensesTotal,
      profit,
      debtPayments,
      cash: {
        inflow: cashInflow,
        outflow: cashOutflow,
        net: cashInflow - cashOutflow,
        registerBalance: cashBalance,
      },
    };
  }

  async getMonthlyReport(year?: number, month?: number) {
    const now = new Date();
    const y = year ?? now.getFullYear();
    const m = month ?? now.getMonth() + 1;
    const { start, end } = monthBounds(y, m);

    const [
      paymentsAgg,
      expensesAgg,
      repairsAgg,
      salesAgg,
      avgRepairAgg,
      topModels,
      topParts,
    ] = await Promise.all([
      this.paymentModel
        .aggregate<{ total: number }>([
          { $match: { createdAt: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ])
        .exec(),
      this.expenseModel
        .aggregate<{ total: number }>([
          { $match: { createdAt: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ])
        .exec(),
      this.repairModel
        .aggregate<{ count: number }>([
          { $match: { createdAt: { $gte: start, $lte: end } } },
          { $group: { _id: null, count: { $sum: 1 } } },
        ])
        .exec(),
      this.saleModel
        .aggregate<{ count: number; total: number }>([
          {
            $match: {
              status: SaleStatus.COMPLETED,
              createdAt: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              total: { $sum: '$total' },
            },
          },
        ])
        .exec(),
      this.repairModel
        .aggregate<{ avg: number }>([
          {
            $match: {
              status: RepairStatus.DELIVERED,
              deliveredAt: { $gte: start, $lte: end },
            },
          },
          { $group: { _id: null, avg: { $avg: '$finalPrice' } } },
        ])
        .exec(),
      this.repairModel
        .aggregate<{ model: string; count: number }>([
          { $match: { createdAt: { $gte: start, $lte: end } } },
          {
            $lookup: {
              from: 'phones',
              localField: 'phoneId',
              foreignField: '_id',
              as: 'phone',
            },
          },
          { $unwind: { path: '$phone', preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: {
                brand: '$phone.brand',
                model: '$phone.model',
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
          {
            $project: {
              _id: 0,
              model: {
                $trim: {
                  input: {
                    $concat: [
                      { $ifNull: ['$_id.brand', ''] },
                      ' ',
                      { $ifNull: ['$_id.model', 'Noma’lum'] },
                    ],
                  },
                },
              },
              count: 1,
            },
          },
        ])
        .exec(),
      this.movementModel
        .aggregate<{ productName: string; quantity: number }>([
          {
            $match: {
              type: {
                $in: [
                  InventoryMovementType.REPAIR_USAGE,
                  InventoryMovementType.SALE,
                ],
              },
              createdAt: { $gte: start, $lte: end },
            },
          },
          {
            $lookup: {
              from: 'products',
              localField: 'productId',
              foreignField: '_id',
              as: 'product',
            },
          },
          { $unwind: '$product' },
          {
            $group: {
              _id: '$productId',
              productName: { $first: '$product.name' },
              quantity: { $sum: '$quantity' },
            },
          },
          { $sort: { quantity: -1 } },
          { $limit: 10 },
          { $project: { _id: 0, productName: 1, quantity: 1 } },
        ])
        .exec(),
    ]);

    const revenue = paymentsAgg[0]?.total ?? 0;
    const expenses = expensesAgg[0]?.total ?? 0;

    return {
      year: y,
      month: m,
      period: { start, end },
      revenue,
      expenses,
      profit: revenue - expenses,
      repairCount: repairsAgg[0]?.count ?? 0,
      saleCount: salesAgg[0]?.count ?? 0,
      salesTotal: salesAgg[0]?.total ?? 0,
      averageRepairValue: Math.round(avgRepairAgg[0]?.avg ?? 0),
      topPhoneModels: topModels,
      topSpareParts: topParts,
    };
  }

  async getTechnicianReport(dateFrom?: string, dateTo?: string) {
    const { start, end } = resolveRange({ dateFrom, dateTo });

    const technicians = await this.userModel
      .find({ role: UserRole.TECHNICIAN, isActive: true })
      .select('fullName')
      .exec();

    const repairStats = await this.repairModel
      .aggregate<{
        _id: Types.ObjectId;
        assigned: number;
        completed: number;
        cancelled: number;
      }>([
        {
          $match: {
            assignedTechnicianId: { $exists: true, $ne: null },
            createdAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: '$assignedTechnicianId',
            assigned: { $sum: 1 },
            completed: {
              $sum: {
                $cond: [{ $eq: ['$status', RepairStatus.DELIVERED] }, 1, 0],
              },
            },
            cancelled: {
              $sum: {
                $cond: [{ $eq: ['$status', RepairStatus.CANCELLED] }, 1, 0],
              },
            },
          },
        },
      ])
      .exec();

    const revenueStats = await this.paymentModel
      .aggregate<{ _id: Types.ObjectId; revenue: number }>([
        {
          $match: {
            repairId: { $exists: true, $ne: null },
            createdAt: { $gte: start, $lte: end },
          },
        },
        {
          $lookup: {
            from: 'repairorders',
            localField: 'repairId',
            foreignField: '_id',
            as: 'repair',
          },
        },
        { $unwind: '$repair' },
        {
          $group: {
            _id: '$repair.assignedTechnicianId',
            revenue: { $sum: '$amount' },
          },
        },
      ])
      .exec();

    const repairMap = new Map(
      repairStats.map((r) => [String(r._id), r]),
    );
    const revenueMap = new Map(
      revenueStats.map((r) => [String(r._id), r.revenue]),
    );

    const rows = technicians.map((tech) => {
      const stats = repairMap.get(tech.id);
      return {
        technicianId: tech.id,
        technicianName: tech.fullName,
        assignedRepairs: stats?.assigned ?? 0,
        completedRepairs: stats?.completed ?? 0,
        cancelledRepairs: stats?.cancelled ?? 0,
        revenue: revenueMap.get(tech.id) ?? 0,
      };
    });

    return {
      period: { start, end },
      technicians: rows.sort((a, b) => b.revenue - a.revenue),
    };
  }

  async getInventoryReport(dateFrom?: string, dateTo?: string) {
    const { start, end } = resolveRange({ dateFrom, dateTo });

    const [stockAgg, lowStockCount, productCount, topParts, movementSummary] =
      await Promise.all([
        this.productModel
          .aggregate<{ totalUnits: number; stockValue: number }>([
            { $match: { isActive: true } },
            {
              $group: {
                _id: null,
                totalUnits: { $sum: '$stock' },
                stockValue: {
                  $sum: { $multiply: ['$stock', '$purchasePrice'] },
                },
              },
            },
          ])
          .exec(),
        this.productModel
          .countDocuments({
            isActive: true,
            $expr: { $lte: ['$stock', '$minimumStock'] },
          })
          .exec(),
        this.productModel.countDocuments({ isActive: true }).exec(),
        this.movementModel
          .aggregate<{ productName: string; quantity: number; type: string }>([
            {
              $match: {
                createdAt: { $gte: start, $lte: end },
                type: {
                  $in: [
                    InventoryMovementType.REPAIR_USAGE,
                    InventoryMovementType.SALE,
                    InventoryMovementType.OUT,
                  ],
                },
              },
            },
            {
              $lookup: {
                from: 'products',
                localField: 'productId',
                foreignField: '_id',
                as: 'product',
              },
            },
            { $unwind: '$product' },
            {
              $group: {
                _id: { productId: '$productId', type: '$type' },
                productName: { $first: '$product.name' },
                quantity: { $sum: '$quantity' },
                type: { $first: '$type' },
              },
            },
            { $sort: { quantity: -1 } },
            { $limit: 15 },
            {
              $project: {
                _id: 0,
                productName: 1,
                quantity: 1,
                type: 1,
              },
            },
          ])
          .exec(),
        this.movementModel
          .aggregate<{ type: string; count: number; quantity: number }>([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            {
              $group: {
                _id: '$type',
                count: { $sum: 1 },
                quantity: { $sum: '$quantity' },
              },
            },
            {
              $project: {
                _id: 0,
                type: '$_id',
                count: 1,
                quantity: 1,
              },
            },
            { $sort: { quantity: -1 } },
          ])
          .exec(),
      ]);

    const products = await this.productModel
      .find({ isActive: true })
      .sort({ stock: 1 })
      .limit(200)
      .select('name sku stock minimumStock purchasePrice salePrice')
      .lean()
      .exec();

    return {
      period: { start, end },
      currentStock: {
        totalUnits: stockAgg[0]?.totalUnits ?? 0,
        stockValue: stockAgg[0]?.stockValue ?? 0,
        productCount,
      },
      lowStockCount,
      products: products.map((p) => ({
        id: String(p._id),
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        minimumStock: p.minimumStock,
        purchasePrice: p.purchasePrice,
        stockValue: p.stock * p.purchasePrice,
        isLowStock: p.stock <= p.minimumStock,
      })),
      mostUsedParts: topParts,
      movementsByType: movementSummary,
    };
  }
}
