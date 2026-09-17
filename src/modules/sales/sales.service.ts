import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { buildPaginationMeta } from '../../common/dto/paginated-response.dto.js';
import { CashTransactionType } from '../../common/enums/cash-transaction-type.enum.js';
import { InventoryMovementType } from '../../common/enums/inventory-movement-type.enum.js';
import { PaymentMethod } from '../../common/enums/payment-method.enum.js';
import { SaleStatus } from '../../common/enums/sale-status.enum.js';
import { CashShiftService } from '../finance/cash-shift.service.js';
import {
  CashTransaction,
  CashTransactionDocument,
} from '../finance/schemas/cash-transaction.schema.js';
import { Payment, PaymentDocument } from '../finance/schemas/payment.schema.js';
import { InventoryStockService } from '../inventory/inventory-stock.service.js';
import { ProductsService } from '../inventory/products.service.js';
import { CreateSaleDto } from './dto/create-sale.dto.js';
import { SalePaymentDto } from './dto/sale-payment.dto.js';
import { SalesQueryDto } from './dto/sales-query.dto.js';
import { toSaleReceipt, toSaleResponse } from './sales.mapper.js';
import {
  SaleAudit,
  SaleAuditDocument,
  SaleAuditEventType,
} from './schemas/sale-audit.schema.js';
import {
  SaleNumberCounter,
  SaleNumberCounterDocument,
} from './schemas/sale-number-counter.schema.js';
import { Sale, SaleDocument } from './schemas/sale.schema.js';
import { calculateSaleAmounts } from './utils/sale-amounts.util.js';
import { AuditAction } from '../audit/enums/audit-action.enum.js';
import { AuditEntityType } from '../audit/enums/audit-entity-type.enum.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale.name)
    private readonly saleModel: Model<SaleDocument>,
    @InjectModel(SaleNumberCounter.name)
    private readonly counterModel: Model<SaleNumberCounterDocument>,
    @InjectModel(SaleAudit.name)
    private readonly auditModel: Model<SaleAuditDocument>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(CashTransaction.name)
    private readonly transactionModel: Model<CashTransactionDocument>,
    private readonly productsService: ProductsService,
    private readonly stockService: InventoryStockService,
    private readonly cashShiftService: CashShiftService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  private shopInfo() {
    return this.configService.get<{ name: string; phone: string; address: string }>(
      'shop',
    )!;
  }

  async findAll(query: SalesQueryDto) {
    const { page, limit, customerId, status, search } = query;
    const filter: Record<string, unknown> = {};
    if (customerId) {
      filter.customerId = customerId;
    }
    if (status) {
      filter.status = status;
    }
    if (search?.trim()) {
      filter.saleNumber = { $regex: search.trim(), $options: 'i' };
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.saleModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.saleModel.countDocuments(filter).exec(),
    ]);
    return {
      data: items.map(toSaleResponse),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findById(id: string) {
    const sale = await this.saleModel.findById(id).exec();
    if (!sale) {
      throw new NotFoundException('Sotuv topilmadi');
    }
    return toSaleReceipt(sale, this.shopInfo());
  }

  async create(dto: CreateSaleDto, cashierId: string) {
    if (!dto.items.length) {
      throw new BadRequestException('Savat bo‘sh');
    }

    const shiftDoc = await this.cashShiftService.requireOpenShiftDocument();

    return this.stockService.withTransaction(async (session) => {
      const lineItems: SaleDocument['items'] = [];
      let subtotal = 0;

      for (const line of dto.items) {
        const product = await this.productsService.getDocument(line.productId);
        if (!product.isActive) {
          throw new BadRequestException(
            `Mahsulot faol emas: ${product.name}`,
          );
        }
        const unitPrice = product.salePrice;
        const lineTotal = unitPrice * line.quantity;
        subtotal += lineTotal;
        lineItems.push({
          productId: product._id,
          productName: product.name,
          sku: product.sku,
          barcode: product.barcode,
          quantity: line.quantity,
          unitPrice,
          lineTotal,
        } as SaleDocument['items'][number]);
      }

      const discount = dto.discount ?? 0;
      if (discount > subtotal) {
        throw new BadRequestException('Chegirma jami summadan oshmasligi kerak');
      }

      const amounts = calculateSaleAmounts({
        subtotal,
        discount,
        paidAmount: dto.paidAmount,
      });

      if (dto.paidAmount > amounts.total) {
        throw new BadRequestException(
          'To‘langan summa jami summadan oshmasligi kerak',
        );
      }

      const saleNumber = await this.generateSaleNumber();
      const sale = await this.saleModel.create(
        [
          {
            saleNumber,
            customerId: dto.customerId
              ? new Types.ObjectId(dto.customerId)
              : undefined,
            cashierId: new Types.ObjectId(cashierId),
            items: lineItems,
            subtotal,
            discount,
            total: amounts.total,
            paidAmount: dto.paidAmount,
            remainingAmount: amounts.remainingAmount,
            paymentStatus: amounts.paymentStatus,
            paymentMethod: dto.paymentMethod,
            status: SaleStatus.COMPLETED,
          },
        ],
        session ? { session } : undefined,
      );

      const saleDoc = sale[0]!;

      for (let i = 0; i < saleDoc.items.length; i++) {
        const item = saleDoc.items[i]!;
        const { movement } = await this.stockService.applyMovement(
          {
            productId: String(item.productId),
            type: InventoryMovementType.SALE,
            quantity: item.quantity,
            performedBy: cashierId,
            unitCost: item.unitPrice,
            saleId: saleDoc.id,
            note: `Sotuv ${saleNumber}`,
          },
          session,
        );
        item.inventoryMovementId = movement._id;
      }

      saleDoc.markModified('items');
      await saleDoc.save({ session: session ?? null });

      if (dto.paidAmount > 0) {
        await this.recordSalePaymentInternal(
          saleDoc,
          dto.paidAmount,
          dto.paymentMethod,
          cashierId,
          shiftDoc.id,
          session,
        );
      }

      await this.auditModel.create({
        saleId: saleDoc._id,
        eventType: SaleAuditEventType.COMPLETED,
        note: `Sotuv yakunlandi: ${amounts.total} UZS`,
        performedBy: new Types.ObjectId(cashierId),
      });

      this.auditService.record({
        userId: cashierId,
        action: AuditAction.SALE_CREATE,
        entityType: AuditEntityType.SALE,
        entityId: saleDoc.id,
        newValue: {
          saleNumber,
          total: amounts.total,
          paidAmount: dto.paidAmount,
          itemCount: lineItems.length,
        },
      });

      return toSaleReceipt(saleDoc, this.shopInfo());
    });
  }

  async addPayment(saleId: string, dto: SalePaymentDto, cashierId: string) {
    const sale = await this.saleModel.findById(saleId).exec();
    if (!sale) {
      throw new NotFoundException('Sotuv topilmadi');
    }
    if (sale.status === SaleStatus.CANCELLED) {
      throw new BadRequestException('Bekor qilingan sotuvga to‘lov qo‘shib bo‘lmaydi');
    }
    if (sale.remainingAmount <= 0) {
      throw new BadRequestException('Sotuv to‘liq to‘langan');
    }
    if (dto.amount > sale.remainingAmount) {
      throw new BadRequestException(
        `Qoldiqdan oshmasligi kerak (${sale.remainingAmount})`,
      );
    }

    const shiftDoc = await this.cashShiftService.requireOpenShiftDocument();

    await this.recordSalePaymentInternal(
      sale,
      dto.amount,
      dto.paymentMethod,
      cashierId,
      shiftDoc.id,
    );

    sale.paidAmount += dto.amount;
    const amounts = calculateSaleAmounts({
      subtotal: sale.subtotal,
      discount: sale.discount,
      paidAmount: sale.paidAmount,
    });
    sale.remainingAmount = amounts.remainingAmount;
    sale.paymentStatus = amounts.paymentStatus;
    sale.paymentMethod = dto.paymentMethod;
    await sale.save();

    await this.auditModel.create({
      saleId: sale._id,
      eventType: SaleAuditEventType.PAYMENT,
      note: `Qo‘shimcha to‘lov: ${dto.amount} (${dto.paymentMethod})`,
      performedBy: new Types.ObjectId(cashierId),
    });

    return toSaleResponse(sale);
  }

  async cancel(saleId: string, cashierId: string, reason?: string) {
    const sale = await this.saleModel.findById(saleId).exec();
    if (!sale) {
      throw new NotFoundException('Sotuv topilmadi');
    }
    if (sale.status === SaleStatus.CANCELLED) {
      throw new BadRequestException('Sotuv allaqachon bekor qilingan');
    }

    return this.stockService.withTransaction(async (session) => {
      for (const item of sale.items) {
        await this.stockService.applyMovement(
          {
            productId: String(item.productId),
            type: InventoryMovementType.RETURN,
            quantity: item.quantity,
            performedBy: cashierId,
            saleId: sale.id,
            note: `Sotuv bekor qilindi: ${sale.saleNumber}`,
          },
          session,
        );
      }

      if (sale.paidAmount > 0) {
        const shiftDoc =
          await this.cashShiftService.requireOpenShiftDocument();
        await this.transactionModel.create(
          [
            {
              type: CashTransactionType.REFUND,
              amount: sale.paidAmount,
              paymentMethod: sale.paymentMethod,
              saleId: sale._id,
              customerId: sale.customerId,
              shiftId: shiftDoc._id,
              cashierId: new Types.ObjectId(cashierId),
              notes: reason ?? `Sotuv bekor: ${sale.saleNumber}`,
            },
          ],
          session ? { session } : undefined,
        );
      }

      sale.status = SaleStatus.CANCELLED;
      sale.remainingAmount = 0;
      sale.paymentStatus = calculateSaleAmounts({
        subtotal: sale.subtotal,
        discount: sale.discount,
        paidAmount: 0,
      }).paymentStatus;
      await sale.save({ session: session ?? null });

      await this.auditModel.create(
        [
          {
            saleId: sale._id,
            eventType: SaleAuditEventType.CANCELLED,
            note: reason ?? 'Sotuv bekor qilindi',
            performedBy: new Types.ObjectId(cashierId),
          },
        ],
        session ? { session } : undefined,
      );

      this.auditService.record({
        userId: cashierId,
        action: AuditAction.SALE_CANCEL,
        entityType: AuditEntityType.SALE,
        entityId: sale.id,
        previousValue: { status: SaleStatus.COMPLETED },
        newValue: { status: SaleStatus.CANCELLED, reason },
      });

      return toSaleResponse(sale);
    });
  }

  async listAudit(saleId: string) {
    const sale = await this.saleModel.findById(saleId).exec();
    if (!sale) {
      throw new NotFoundException('Sotuv topilmadi');
    }
    const logs = await this.auditModel
      .find({ saleId: new Types.ObjectId(saleId) })
      .sort({ createdAt: -1 })
      .exec();
    return logs.map((log) => ({
      id: log.id,
      eventType: log.eventType,
      note: log.note,
      performedBy: String(log.performedBy),
      createdAt: log.createdAt,
    }));
  }

  private async recordSalePaymentInternal(
    sale: SaleDocument,
    amount: number,
    paymentMethod: PaymentMethod,
    cashierId: string,
    shiftId: string,
    session?: import('mongoose').ClientSession,
  ) {
    const payment = await this.paymentModel.create(
      [
        {
          amount,
          paymentMethod,
          customerId: sale.customerId,
          saleId: sale._id,
          cashierId: new Types.ObjectId(cashierId),
          shiftId: new Types.ObjectId(shiftId),
        },
      ],
      session ? { session } : undefined,
    );

    await this.transactionModel.create(
      [
        {
          type: CashTransactionType.SALE,
          amount,
          paymentMethod,
          paymentId: payment[0]!._id,
          customerId: sale.customerId,
          saleId: sale._id,
          shiftId: new Types.ObjectId(shiftId),
          cashierId: new Types.ObjectId(cashierId),
        },
      ],
      session ? { session } : undefined,
    );
  }

  private async generateSaleNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const counter = await this.counterModel
      .findOneAndUpdate(
        { year },
        { $inc: { seq: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
    const seq = counter?.seq ?? 1;
    return `SAL-${year}-${String(seq).padStart(6, '0')}`;
  }
}
