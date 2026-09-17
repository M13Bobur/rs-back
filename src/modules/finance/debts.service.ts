import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { buildPaginationMeta } from '../../common/dto/paginated-response.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { Customer, CustomerDocument } from '../customers/schemas/customer.schema.js';
import { RepairOrder, RepairOrderDocument } from '../repairs/schemas/repair-order.schema.js';
import { Payment, PaymentDocument } from './schemas/payment.schema.js';

@Injectable()
export class DebtsService {
  constructor(
    @InjectModel(RepairOrder.name)
    private readonly repairModel: Model<RepairOrderDocument>,
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
  ) {}

  async listDebts(query: PaginationQueryDto) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const grouped = await this.repairModel.aggregate<{
      _id: { toString(): string };
      totalDue: number;
      paid: number;
      remaining: number;
    }>([
      { $match: { remainingAmount: { $gt: 0 } } },
      {
        $group: {
          _id: '$customerId',
          totalDue: {
            $sum: {
              $max: [
                0,
                {
                  $subtract: [
                    { $ifNull: ['$finalPrice', '$estimatedPrice'] },
                    { $ifNull: ['$discount', 0] },
                  ],
                },
              ],
            },
          },
          paid: { $sum: '$paidAmount' },
          remaining: { $sum: '$remainingAmount' },
        },
      },
      { $sort: { remaining: -1 } },
    ]);

    let rows = grouped;
    if (search?.trim()) {
      const customers = await this.customerModel
        .find({ fullName: { $regex: search.trim(), $options: 'i' } })
        .select('_id')
        .exec();
      const ids = new Set(customers.map((c) => c.id));
      rows = grouped.filter((row) => ids.has(String(row._id)));
    }

    const total = rows.length;
    const pageRows = rows.slice(skip, skip + limit);

    const customerIds = pageRows.map((row) => String(row._id));
    const customers = await this.customerModel
      .find({ _id: { $in: customerIds } })
      .exec();
    const customerMap = new Map(
      customers.map((c) => [c.id, c as CustomerDocument]),
    );

    const lastPayments = await this.paymentModel.aggregate<{
      _id: { toString(): string };
      lastPaymentAt: Date;
    }>([
      { $match: { customerId: { $in: customerIds } } },
      { $group: { _id: '$customerId', lastPaymentAt: { $max: '$createdAt' } } },
    ]);
    const lastMap = new Map(
      lastPayments.map((p) => [String(p._id), p.lastPaymentAt]),
    );

    const data = pageRows.map((row) => {
      const customer = customerMap.get(String(row._id));
      return {
        customerId: String(row._id),
        customerName: customer?.fullName ?? '—',
        phoneNumber: customer?.phoneNumber,
        totalDebt: row.remaining,
        totalDue: row.totalDue,
        paid: row.paid,
        remaining: row.remaining,
        lastPaymentAt: lastMap.get(String(row._id)),
        status: row.remaining > 0 ? 'OPEN' : 'PAID',
      };
    });

    return {
      data,
      meta: buildPaginationMeta(page, limit, total),
    };
  }
}
