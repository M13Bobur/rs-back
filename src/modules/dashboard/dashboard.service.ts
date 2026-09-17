import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { roleHasPermission } from '../../common/constants/role-permissions.js';
import { Permission } from '../../common/enums/permission.enum.js';
import { RepairStatus } from '../../common/enums/repair-status.enum.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { Product, ProductDocument } from '../inventory/schemas/product.schema.js';
import { RepairOrder, RepairOrderDocument } from '../repairs/schemas/repair-order.schema.js';
import { ReportsService } from '../reports/reports.service.js';
import { todayDateString } from '../reports/utils/report-date.util.js';

@Injectable()
export class DashboardService {
  constructor(
    private readonly reportsService: ReportsService,
    @InjectModel(RepairOrder.name)
    private readonly repairModel: Model<RepairOrderDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async getSummary(role: UserRole) {
    const date = todayDateString();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const canReports = roleHasPermission(role, Permission.REPORTS_VIEW);
    const canRepairs = roleHasPermission(role, Permission.REPAIRS_READ);
    const canInventory = roleHasPermission(role, Permission.INVENTORY_READ);
    const canSales =
      roleHasPermission(role, Permission.SALES_READ) ||
      roleHasPermission(role, Permission.SALES_MANAGE);

    const [daily, monthly, repairStats, inventorySnap, topTechnicians] =
      await Promise.all([
        canReports || canSales
          ? this.reportsService.getDailyReport(date)
          : Promise.resolve(null),
        canReports
          ? this.reportsService.getMonthlyReport(year, month)
          : Promise.resolve(null),
        canRepairs ? this.repairStatusCounts() : Promise.resolve(null),
        canInventory ? this.inventorySnapshot() : Promise.resolve(null),
        canReports
          ? this.reportsService
              .getTechnicianReport(undefined, undefined)
              .then((r) => r.technicians.slice(0, 5))
          : Promise.resolve(null),
      ]);

    return {
      date,
      year,
      month,
      daily: daily
        ? {
            salesTotal: daily.sales.total,
            salesCount: daily.sales.count,
            repairRevenue: canReports ? daily.repairRevenue : undefined,
            paymentsTotal: canReports ? daily.payments.total : undefined,
            expenses: canReports ? daily.expenses : undefined,
            profit: canReports ? daily.profit : undefined,
            debtPayments: canReports ? daily.debtPayments : undefined,
            cashNet: canReports ? daily.cash.net : undefined,
            registerBalance: canReports ? daily.cash.registerBalance : undefined,
          }
        : null,
      monthly: monthly
        ? {
            revenue: monthly.revenue,
            expenses: monthly.expenses,
            profit: monthly.profit,
            repairCount: monthly.repairCount,
            saleCount: monthly.saleCount,
            salesTotal: monthly.salesTotal,
            averageRepairValue: monthly.averageRepairValue,
            topPhoneModels: monthly.topPhoneModels.slice(0, 5),
            topSpareParts: monthly.topSpareParts.slice(0, 5),
          }
        : null,
      repairs: repairStats,
      inventory: inventorySnap,
      technicians: topTechnicians,
    };
  }

  private async repairStatusCounts() {
    const rows = await this.repairModel
      .aggregate<{ _id: RepairStatus; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])
      .exec();

    const byStatus: Partial<Record<RepairStatus, number>> = {};
    let total = 0;
    for (const row of rows) {
      byStatus[row._id] = row.count;
      total += row.count;
    }

    return {
      total,
      byStatus,
      ready: byStatus[RepairStatus.READY] ?? 0,
      inProgress: byStatus[RepairStatus.IN_PROGRESS] ?? 0,
      waitingApproval: byStatus[RepairStatus.WAITING_CUSTOMER_APPROVAL] ?? 0,
    };
  }

  private async inventorySnapshot() {
    const products = await this.productModel
      .find({ isActive: true })
      .select('stock minimumStock purchasePrice')
      .exec();

    let stockValue = 0;
    let lowStockCount = 0;
    let totalUnits = 0;

    for (const p of products) {
      totalUnits += p.stock;
      stockValue += p.stock * p.purchasePrice;
      if (p.minimumStock > 0 && p.stock <= p.minimumStock) {
        lowStockCount += 1;
      }
    }

    return {
      productCount: products.length,
      totalUnits,
      stockValue,
      lowStockCount,
    };
  }
}
