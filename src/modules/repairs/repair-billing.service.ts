import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { InventoryMovementType } from '../../common/enums/inventory-movement-type.enum.js';
import { CatalogServicesService } from '../inventory/catalog-services.service.js';
import { InventoryStockService } from '../inventory/inventory-stock.service.js';
import { ProductsService } from '../inventory/products.service.js';
import { AddRepairPartDto } from './dto/add-repair-part.dto.js';
import { AddRepairServiceDto } from './dto/add-repair-service.dto.js';
import { RepairEventType } from '../../common/enums/repair-event-type.enum.js';
import { RepairOrder, RepairOrderDocument } from './schemas/repair-order.schema.js';
import type { UserDocument } from '../users/schemas/user.schema.js';
import { RepairsService } from './repairs.service.js';

@Injectable()
export class RepairBillingService {
  constructor(
    @InjectModel(RepairOrder.name)
    private readonly repairModel: Model<RepairOrderDocument>,
    private readonly productsService: ProductsService,
    private readonly catalogServices: CatalogServicesService,
    private readonly stockService: InventoryStockService,
    private readonly repairsService: RepairsService,
  ) {}

  async addService(
    repairId: string,
    dto: AddRepairServiceDto,
    actor: UserDocument,
  ) {
    const repair = await this.repairsService.getRepairDocument(repairId);
    this.repairsService.assertRepairAssignedManage(actor, repair);
    const performedBy = actor.id;
    const catalog = await this.catalogServices.getDocument(dto.serviceId);
    const quantity = dto.quantity ?? 1;
    const unitPrice = catalog.defaultPrice;
    repair.orderServices.push({
      serviceId: catalog._id,
      serviceName: catalog.name,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    } as RepairOrderDocument['orderServices'][number]);
    this.repairsService.syncRepairPricing(repair);
    await repair.save();
    await this.repairsService.recordEventPublic({
      repairOrderId: repair.id,
      eventType: RepairEventType.UPDATED,
      note: `Xizmat qo‘shildi: ${catalog.name}`,
      performedBy,
    });
    return this.repairsService.findById(repair.id, actor);
  }

  async removeService(
    repairId: string,
    lineId: string,
    actor: UserDocument,
  ) {
    const repair = await this.repairsService.getRepairDocument(repairId);
    this.repairsService.assertRepairAssignedManage(actor, repair);
    const performedBy = actor.id;
    const line = repair.orderServices.find(
      (item) => String((item as { _id?: { toString(): string } })._id) === lineId,
    );
    if (!line) {
      throw new NotFoundException('Xizmat qatori topilmadi');
    }
    repair.orderServices = repair.orderServices.filter(
      (item) => String((item as { _id?: { toString(): string } })._id) !== lineId,
    );
    this.repairsService.syncRepairPricing(repair);
    await repair.save();
    await this.repairsService.recordEventPublic({
      repairOrderId: repair.id,
      eventType: RepairEventType.UPDATED,
      note: `Xizmat olib tashlandi: ${line.serviceName}`,
      performedBy,
    });
    return this.repairsService.findById(repair.id, actor);
  }

  async addPart(repairId: string, dto: AddRepairPartDto, actor: UserDocument) {
    const performedBy = actor.id;
    return this.stockService.withTransaction(async (session) => {
      const repair = await this.repairModel
        .findById(repairId)
        .session(session ?? null)
        .exec();
      if (!repair) {
        throw new NotFoundException('Ta’mirlash buyurtmasi topilmadi');
      }
      this.repairsService.assertRepairAssignedManage(actor, repair);

      const product = await this.productsService.getDocument(dto.productId);
      const quantity = dto.quantity ?? 1;
      const unitPrice = product.salePrice;

      const partLine = {
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity,
      };

      repair.orderParts.push(
        partLine as RepairOrderDocument['orderParts'][number],
      );
      await repair.save({ session });

      const savedPart = repair.orderParts[repair.orderParts.length - 1]!;
      const partLineId = String(
        (savedPart as { _id?: { toString(): string } })._id,
      );

      const { movement } = await this.stockService.applyMovement(
        {
          productId: product.id,
          type: InventoryMovementType.REPAIR_USAGE,
          quantity,
          performedBy,
          repairOrderId: repair.id,
          repairPartLineId: partLineId,
          note: `Ta’mirlash: ${repair.repairNumber}`,
        },
        session,
      );

      savedPart.inventoryMovementId = movement._id as Types.ObjectId;
      this.repairsService.syncRepairPricing(repair);
      await repair.save({ session });

      await this.repairsService.recordEventPublic({
        repairOrderId: repair.id,
        eventType: RepairEventType.UPDATED,
        note: `Ehtiyot qism qo‘shildi: ${product.name} × ${quantity}`,
        performedBy,
      });

      return this.repairsService.findById(repair.id, actor);
    });
  }

  async removePart(repairId: string, lineId: string, actor: UserDocument) {
    const performedBy = actor.id;
    return this.stockService.withTransaction(async (session) => {
      const repair = await this.repairModel
        .findById(repairId)
        .session(session ?? null)
        .exec();
      if (!repair) {
        throw new NotFoundException('Ta’mirlash buyurtmasi topilmadi');
      }
      this.repairsService.assertRepairAssignedManage(actor, repair);

      const line = repair.orderParts.find(
        (item) => String((item as { _id?: { toString(): string } })._id) === lineId,
      );
      if (!line) {
        throw new NotFoundException('Qism qatori topilmadi');
      }

      await this.stockService.applyMovement(
        {
          productId: String(line.productId),
          type: InventoryMovementType.RETURN,
          quantity: line.quantity,
          performedBy,
          repairOrderId: repair.id,
          repairPartLineId: lineId,
          note: `Ta’mirlashdan qaytarildi: ${repair.repairNumber}`,
        },
        session,
      );

      repair.orderParts = repair.orderParts.filter(
        (item) => String((item as { _id?: { toString(): string } })._id) !== lineId,
      );
      this.repairsService.syncRepairPricing(repair);
      await repair.save({ session });

      await this.repairsService.recordEventPublic({
        repairOrderId: repair.id,
        eventType: RepairEventType.UPDATED,
        note: `Ehtiyot qism olib tashlandi: ${line.productName}`,
        performedBy,
      });

      return this.repairsService.findById(repair.id, actor);
    });
  }
}
