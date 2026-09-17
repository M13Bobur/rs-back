import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Types } from 'mongoose';
import { buildPaginationMeta } from '../../common/dto/paginated-response.dto.js';
import { RepairEventType } from '../../common/enums/repair-event-type.enum.js';
import { RepairStatus } from '../../common/enums/repair-status.enum.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { Customer, CustomerDocument } from '../customers/schemas/customer.schema.js';
import { Phone, PhoneDocument } from '../phones/schemas/phone.schema.js';
import { User, UserDocument } from '../users/schemas/user.schema.js';
import { RepairNotificationFacade } from '../notifications/repair-notification.facade.js';
import { AuditAction } from '../audit/enums/audit-action.enum.js';
import { AuditEntityType } from '../audit/enums/audit-entity-type.enum.js';
import { AuditService } from '../audit/audit.service.js';
import { StaffAlertsService } from '../alerts/staff-alerts.service.js';
import {
  canCancelOrDeliver,
  canTransitionStatus,
} from './constants/repair-status.policy.js';
import { CreateRepairDto } from './dto/create-repair.dto.js';
import { RepairResponseDto } from './dto/repair-response.dto.js';
import { RepairsQueryDto } from './dto/repairs-query.dto.js';
import { UpdateRepairDto } from './dto/update-repair.dto.js';
import { UpdateRepairStatusDto } from './dto/update-repair-status.dto.js';
import { UpdateDiagnosticsDto } from './dto/update-diagnostics.dto.js';
import { UpdateReceptionDto } from './dto/update-reception.dto.js';
import { ReceptionChecklistDto } from './dto/reception-checklist.dto.js';
import { PhysicalConditionDto } from './dto/physical-condition.dto.js';
import { AccessoriesChecklistDto } from './dto/accessories-checklist.dto.js';
import { RepairPhotoType } from '../../common/enums/repair-photo-type.enum.js';
import { rmSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { toRepairResponse } from './repairs.mapper.js';
import {
  RepairHistory,
  RepairHistoryDocument,
} from './schemas/repair-history.schema.js';
import {
  RepairNumberCounter,
  RepairNumberCounterDocument,
} from './schemas/repair-number-counter.schema.js';
import { RepairOrder, RepairOrderDocument } from './schemas/repair-order.schema.js';
import { calculateRepairAmounts } from './utils/repair-amounts.util.js';
import { applyRepairPricing } from './utils/repair-pricing.util.js';

const POPULATE_PATHS = [
  { path: 'customerId', select: 'fullName phoneNumber' },
  { path: 'phoneId', select: 'brand model imei' },
  { path: 'assignedTechnicianId', select: 'fullName' },
  { path: 'createdBy', select: 'fullName' },
];

@Injectable()
export class RepairsService {
  constructor(
    @InjectModel(RepairOrder.name)
    private readonly repairModel: Model<RepairOrderDocument>,
    @InjectModel(RepairHistory.name)
    private readonly historyModel: Model<RepairHistoryDocument>,
    @InjectModel(RepairNumberCounter.name)
    private readonly counterModel: Model<RepairNumberCounterDocument>,
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(Phone.name)
    private readonly phoneModel: Model<PhoneDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly repairNotifications: RepairNotificationFacade,
    private readonly auditService: AuditService,
    private readonly staffAlertsService: StaffAlertsService,
  ) {}

  assertRepairReadAccess(
    actor: UserDocument,
    repair: RepairOrderDocument,
  ): void {
    if (actor.role === UserRole.TECHNICIAN) {
      if (String(repair.assignedTechnicianId) !== actor.id) {
        throw new ForbiddenException(
          'Faqat sizga biriktirilgan buyurtmalarni ko‘rishingiz mumkin',
        );
      }
    }
  }

  assertRepairAssignedManage(
    actor: UserDocument,
    repair: RepairOrderDocument,
  ): void {
    if (actor.role === UserRole.TECHNICIAN) {
      this.assertRepairReadAccess(actor, repair);
      return;
    }
  }

  async findAll(
    query: RepairsQueryDto,
    actor?: UserDocument,
  ): Promise<{
    data: RepairResponseDto[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { page, limit } = query;
    const filter = await this.buildFilter(query, actor);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.repairModel
        .find(filter)
        .populate(POPULATE_PATHS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.repairModel.countDocuments(filter).exec(),
    ]);

    return {
      data: items.map((item) => toRepairResponse(item)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findById(id: string, actor?: UserDocument): Promise<RepairResponseDto> {
    const repair = await this.getRepairDocument(id);
    if (actor) {
      this.assertRepairReadAccess(actor, repair);
    }
    const history = await this.historyModel
      .find({ repairOrderId: repair._id })
      .populate('performedBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();

    return toRepairResponse(repair, history);
  }

  async create(
    dto: CreateRepairDto,
    createdByUserId: string,
  ): Promise<RepairResponseDto> {
    await this.ensureCustomerExists(dto.customerId);
    const phone = await this.ensurePhoneBelongsToCustomer(
      dto.phoneId,
      dto.customerId,
    );

    if (dto.assignedTechnicianId) {
      await this.ensureTechnician(dto.assignedTechnicianId);
    }

    const repairNumber = await this.generateRepairNumber();
    const amounts = calculateRepairAmounts({
      estimatedPrice: dto.estimatedPrice ?? 0,
      discount: 0,
      paidAmount: 0,
    });

    const repair = await this.repairModel.create({
      repairNumber,
      customerId: dto.customerId,
      phoneId: dto.phoneId,
      imei: dto.imei ?? phone.imei,
      reportedProblem: dto.reportedProblem,
      initialCondition: dto.initialCondition,
      assignedTechnicianId: dto.assignedTechnicianId,
      estimatedPrice: dto.estimatedPrice ?? 0,
      discount: 0,
      paidAmount: 0,
      remainingAmount: amounts.remainingAmount,
      paymentStatus: amounts.paymentStatus,
      status: RepairStatus.WAITING,
      customerNotes: dto.customerNotes,
      internalNotes: dto.internalNotes,
      approvalStatus: dto.approvalStatus,
      createdBy: createdByUserId,
      receptionChecklist: dto.reception?.checklist ?? {},
      physicalConditionChecklist: dto.reception?.physicalCondition ?? {},
      accessoriesChecklist: dto.reception?.accessories ?? {},
    });

    await this.recordEvent({
      repairOrderId: repair.id,
      eventType: RepairEventType.CREATED,
      toStatus: RepairStatus.WAITING,
      note: 'Ta’mirlash buyurtmasi yaratildi',
      performedBy: createdByUserId,
    });

    this.repairNotifications.repairAccepted({
      customerId: String(repair.customerId),
      repairId: repair.id,
      repairNumber: repair.repairNumber,
    });

    this.auditService.record({
      userId: createdByUserId,
      action: AuditAction.REPAIR_CREATE,
      entityType: AuditEntityType.REPAIR,
      entityId: repair.id,
      newValue: {
        repairNumber: repair.repairNumber,
        customerId: String(repair.customerId),
        status: repair.status,
      },
    });

    return this.findById(repair.id);
  }

  async update(
    id: string,
    dto: UpdateRepairDto,
    performedBy: string,
  ): Promise<RepairResponseDto> {
    const repair = await this.getRepairDocument(id);
    const previousSnapshot = {
      status: repair.status,
      assignedTechnicianId: repair.assignedTechnicianId
        ? String(repair.assignedTechnicianId)
        : undefined,
      estimatedPrice: repair.estimatedPrice,
      discount: repair.discount,
    };

    if (dto.assignedTechnicianId) {
      await this.ensureTechnician(dto.assignedTechnicianId);
    }

    const { paidAmount: _paidAmount, ...updateFields } = dto;
    void _paidAmount;
    Object.assign(repair, updateFields);
    this.syncRepairPricing(repair);

    await repair.save();

    await this.recordEvent({
      repairOrderId: repair.id,
      eventType: RepairEventType.UPDATED,
      note: 'Buyurtma yangilandi',
      performedBy,
    });

    this.auditService.record({
      userId: performedBy,
      action: AuditAction.REPAIR_UPDATE,
      entityType: AuditEntityType.REPAIR,
      entityId: repair.id,
      previousValue: previousSnapshot,
      newValue: {
        status: repair.status,
        assignedTechnicianId: repair.assignedTechnicianId
          ? String(repair.assignedTechnicianId)
          : undefined,
        estimatedPrice: repair.estimatedPrice,
        discount: repair.discount,
      },
    });

    return this.findById(repair.id);
  }

  async updateStatus(
    id: string,
    dto: UpdateRepairStatusDto,
    user: UserDocument,
  ): Promise<RepairResponseDto> {
    const repair = await this.getRepairDocument(id);
    const fromStatus = repair.status;
    const toStatus = dto.status;

    if (fromStatus === toStatus) {
      throw new BadRequestException('Status allaqachon shu holatda');
    }

    if (!canTransitionStatus(user.role, fromStatus, toStatus)) {
      throw new ForbiddenException('Bu status o‘zgarishiga ruxsat yo‘q');
    }

    if (
      toStatus === RepairStatus.CANCELLED ||
      toStatus === RepairStatus.DELIVERED
    ) {
      if (!canCancelOrDeliver(user.role)) {
        throw new ForbiddenException(
          'Faqat menejer yoki admin topshirish/bekor qilishni tasdiqlay oladi',
        );
      }
    }

    if (toStatus === RepairStatus.DELIVERED) {
      const amounts = calculateRepairAmounts({
        estimatedPrice: repair.estimatedPrice,
        finalPrice: repair.finalPrice,
        discount: repair.discount,
        paidAmount: repair.paidAmount,
      });

      if (
        amounts.remainingAmount > 0 &&
        !(user.role === UserRole.ADMIN && dto.allowUnpaidDelivery)
      ) {
        throw new BadRequestException(
          'To‘lanmagan qoldiq bor. Topshirish uchun to‘lovni yakunlang yoki ADMIN tasdig‘i kerak',
        );
      }

      repair.deliveredAt = new Date();
      repair.deliveredBy = new Types.ObjectId(user.id);
    }

    repair.status = toStatus;
    await repair.save();

    await this.recordEvent({
      repairOrderId: repair.id,
      eventType:
        toStatus === RepairStatus.DELIVERED
          ? RepairEventType.DELIVERED
          : RepairEventType.STATUS_CHANGED,
      fromStatus,
      toStatus,
      note: dto.note,
      performedBy: user.id,
    });

    this.repairNotifications.statusChanged({
      customerId: String(repair.customerId),
      repairId: repair.id,
      repairNumber: repair.repairNumber,
      fromStatus,
      toStatus,
      estimatedTotal: repair.finalPrice ?? repair.estimatedPrice,
    });

    this.auditService.record({
      userId: user.id,
      action: AuditAction.REPAIR_STATUS_CHANGE,
      entityType: AuditEntityType.REPAIR,
      entityId: repair.id,
      previousValue: { status: fromStatus },
      newValue: { status: toStatus, note: dto.note },
    });

    const estimatedTotal = repair.finalPrice ?? repair.estimatedPrice;
    if (toStatus === RepairStatus.WAITING_CUSTOMER_APPROVAL) {
      this.staffAlertsService.approvalRequired({
        repairId: repair.id,
        repairNumber: repair.repairNumber,
        amount: estimatedTotal,
      });
    }
    if (toStatus === RepairStatus.READY) {
      this.staffAlertsService.repairReady({
        repairId: repair.id,
        repairNumber: repair.repairNumber,
      });
    }

    return this.findById(repair.id);
  }

  async remove(id: string): Promise<void> {
    const repair = await this.repairModel.findByIdAndDelete(id).exec();
    if (!repair) {
      throw new NotFoundException('Ta’mirlash buyurtmasi topilmadi');
    }
    await this.historyModel.deleteMany({ repairOrderId: id }).exec();
    try {
      rmSync(join(process.cwd(), 'uploads', 'repairs', id), {
        recursive: true,
        force: true,
      });
    } catch {
      /* ignore missing folder */
    }
  }

  async getReception(id: string, actor?: UserDocument) {
    const repair = await this.getRepairDocument(id);
    if (actor) {
      this.assertRepairReadAccess(actor, repair);
    }
    return this.buildReceptionPayload(repair);
  }

  async updateReception(
    id: string,
    dto: UpdateReceptionDto,
    performedBy: string,
  ): Promise<RepairResponseDto> {
    const repair = await this.getRepairDocument(id);
    this.applyReceptionUpdates(repair, dto);
    await repair.save();
    await this.recordEvent({
      repairOrderId: repair.id,
      eventType: RepairEventType.UPDATED,
      note: 'Qabul ma’lumotlari yangilandi',
      performedBy,
    });
    return this.findById(repair.id);
  }

  async updateChecklist(
    id: string,
    dto: ReceptionChecklistDto,
    performedBy: string,
  ): Promise<RepairResponseDto> {
    return this.updateReception(id, { checklist: dto }, performedBy);
  }

  async updatePhysicalCondition(
    id: string,
    dto: PhysicalConditionDto,
    performedBy: string,
  ): Promise<RepairResponseDto> {
    return this.updateReception(
      id,
      { physicalCondition: dto },
      performedBy,
    );
  }

  async updateAccessories(
    id: string,
    dto: AccessoriesChecklistDto,
    performedBy: string,
  ): Promise<RepairResponseDto> {
    return this.updateReception(id, { accessories: dto }, performedBy);
  }

  async getDiagnostics(id: string, actor?: UserDocument) {
    const repair = await this.getRepairDocument(id);
    if (actor) {
      this.assertRepairReadAccess(actor, repair);
    }
    return repair.diagnostics ?? {};
  }

  async updateDiagnostics(
    id: string,
    dto: UpdateDiagnosticsDto,
    actor: UserDocument,
  ): Promise<RepairResponseDto> {
    const repair = await this.getRepairDocument(id);
    this.assertRepairAssignedManage(actor, repair);
    const performedBy = actor.id;
    repair.diagnostics = { ...repair.diagnostics, ...dto };
    if (dto.diagnosticResult !== undefined) {
      repair.diagnosticResult = dto.diagnosticResult;
    }
    if (dto.estimatedLabor !== undefined) {
      repair.laborAmount = dto.estimatedLabor;
    }
    this.syncRepairPricing(repair);
    await repair.save();
    await this.recordEvent({
      repairOrderId: repair.id,
      eventType: RepairEventType.UPDATED,
      note: 'Diagnostika yangilandi',
      performedBy,
    });

    if (dto.diagnosticResult !== undefined && dto.diagnosticResult.trim()) {
      this.repairNotifications.diagnosisCompleted({
        customerId: String(repair.customerId),
        repairId: repair.id,
        repairNumber: repair.repairNumber,
      });
    }

    return this.findById(repair.id, actor);
  }

  async uploadPhoto(
    id: string,
    file: Express.Multer.File,
    type: RepairPhotoType,
    uploadedBy: string,
  ): Promise<RepairResponseDto> {
    if (!file) {
      throw new BadRequestException('Rasm fayli topilmadi');
    }
    const repair = await this.getRepairDocument(id);
    const url = `/uploads/repairs/${id}/${file.filename}`;
    repair.photos.push({
      type,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url,
      uploadedBy: new Types.ObjectId(uploadedBy),
    } as never);
    await repair.save();
    await this.recordEvent({
      repairOrderId: repair.id,
      eventType: RepairEventType.UPDATED,
      note: `Rasm yuklandi (${type})`,
      performedBy: uploadedBy,
    });
    return this.findById(repair.id);
  }

  async deletePhoto(
    id: string,
    photoId: string,
    performedBy: string,
  ): Promise<RepairResponseDto> {
    const repair = await this.getRepairDocument(id);
    const photo = repair.photos.find(
      (item) => String((item as { _id?: { toString(): string } })._id) === photoId,
    );
    if (!photo) {
      throw new NotFoundException('Rasm topilmadi');
    }
    try {
      unlinkSync(
        join(process.cwd(), 'uploads', 'repairs', id, photo.filename),
      );
    } catch {
      /* ignore */
    }
    repair.photos = repair.photos.filter(
      (item) => String((item as { _id?: { toString(): string } })._id) !== photoId,
    );
    await repair.save();
    await this.recordEvent({
      repairOrderId: repair.id,
      eventType: RepairEventType.UPDATED,
      note: 'Rasm o‘chirildi',
      performedBy,
    });
    return this.findById(repair.id);
  }

  private plainSubdocument<T extends Record<string, unknown>>(
    value: unknown,
  ): T {
    if (!value || typeof value !== 'object') {
      return {} as T;
    }
    if ('toObject' in value && typeof value.toObject === 'function') {
      return value.toObject() as T;
    }
    return { ...(value as T) };
  }

  private applyReceptionUpdates(
    repair: RepairOrderDocument,
    dto: UpdateReceptionDto,
  ): void {
    if (dto.checklist) {
      for (const [key, value] of Object.entries(dto.checklist)) {
        if (value !== undefined) {
          repair.set(`receptionChecklist.${key}`, value);
        }
      }
    }
    if (dto.physicalCondition) {
      for (const [key, value] of Object.entries(dto.physicalCondition)) {
        if (value !== undefined) {
          repair.set(`physicalConditionChecklist.${key}`, value);
        }
      }
    }
    if (dto.accessories) {
      for (const [key, value] of Object.entries(dto.accessories)) {
        if (value !== undefined) {
          repair.set(`accessoriesChecklist.${key}`, value);
        }
      }
    }
  }

  private buildReceptionPayload(repair: RepairOrderDocument) {
    return {
      checklist: this.plainSubdocument(repair.receptionChecklist),
      physicalCondition: this.plainSubdocument(
        repair.physicalConditionChecklist,
      ),
      accessories: this.plainSubdocument(repair.accessoriesChecklist),
      photos: (repair.photos ?? []).map((photo) => ({
        id: String((photo as { _id?: { toString(): string } })._id ?? ''),
        type: photo.type,
        url: photo.url,
        originalName: photo.originalName,
        mimeType: photo.mimeType,
        size: photo.size,
        createdAt: photo.createdAt,
      })),
    };
  }

  async listTechnicians(): Promise<{ id: string; fullName: string }[]> {
    const users = await this.userModel
      .find({ role: UserRole.TECHNICIAN, isActive: true })
      .select('fullName')
      .sort({ fullName: 1 })
      .exec();

    return users.map((user) => ({ id: user.id, fullName: user.fullName }));
  }

  syncRepairPricing(repair: RepairOrderDocument): void {
    const pricing = applyRepairPricing(repair);
    repair.servicesTotal = pricing.servicesTotal;
    repair.partsTotal = pricing.partsTotal;
    repair.laborAmount = pricing.laborAmount;
    repair.finalPrice = pricing.finalPrice;
    repair.estimatedPrice = pricing.finalPrice;
    repair.remainingAmount = pricing.remainingAmount;
    repair.paymentStatus = pricing.paymentStatus;
  }

  async getRepairDocument(id: string): Promise<RepairOrderDocument> {
    const repair = await this.repairModel
      .findById(id)
      .populate(POPULATE_PATHS)
      .exec();

    if (!repair) {
      throw new NotFoundException('Ta’mirlash buyurtmasi topilmadi');
    }

    return repair;
  }

  private async generateRepairNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const counter = await this.counterModel
      .findOneAndUpdate(
        { year },
        { $inc: { seq: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    const seq = counter?.seq ?? 1;
    return `REP-${year}-${String(seq).padStart(6, '0')}`;
  }

  private async buildFilter(
    query: RepairsQueryDto,
    actor?: UserDocument,
  ): Promise<Record<string, unknown>> {
    const filter: Record<string, unknown> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (actor?.role === UserRole.TECHNICIAN) {
      filter.assignedTechnicianId = actor._id;
    } else if (query.assignedTechnicianId) {
      filter.assignedTechnicianId = query.assignedTechnicianId;
    }

    if (query.dateFrom || query.dateTo) {
      filter.createdAt = {};
      if (query.dateFrom) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(
          query.dateFrom,
        );
      }
      if (query.dateTo) {
        const end = new Date(query.dateTo);
        end.setHours(23, 59, 59, 999);
        (filter.createdAt as Record<string, Date>).$lte = end;
      }
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      const regex = new RegExp(
        term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i',
      );

      const [customers, phones] = await Promise.all([
        this.customerModel
          .find({ $or: [{ fullName: regex }, { phoneNumber: regex }] })
          .select('_id')
          .exec(),
        this.phoneModel
          .find({ $or: [{ model: regex }, { brand: regex }] })
          .select('_id')
          .exec(),
      ]);

      filter.$or = [
        { repairNumber: regex },
        { imei: regex },
        { customerId: { $in: customers.map((c) => c._id) } },
        { phoneId: { $in: phones.map((p) => p._id) } },
      ];
    }

    return filter;
  }

  private async ensureCustomerExists(customerId: string): Promise<void> {
    const exists = await this.customerModel.exists({ _id: customerId }).exec();
    if (!exists) {
      throw new NotFoundException('Mijoz topilmadi');
    }
  }

  private async ensurePhoneBelongsToCustomer(
    phoneId: string,
    customerId: string,
  ): Promise<PhoneDocument> {
    const phone = await this.phoneModel.findById(phoneId).exec();
    if (!phone) {
      throw new NotFoundException('Telefon topilmadi');
    }
    if (String(phone.customerId) !== customerId) {
      throw new BadRequestException('Telefon tanlangan mijozga tegishli emas');
    }
    return phone;
  }

  private async ensureTechnician(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user || user.role !== UserRole.TECHNICIAN || !user.isActive) {
      throw new BadRequestException('Faol usta tanlanishi kerak');
    }
  }

  async recordEventPublic(input: {
    repairOrderId: string;
    eventType: RepairEventType;
    fromStatus?: RepairStatus;
    toStatus?: RepairStatus;
    note?: string;
    performedBy: string;
  }): Promise<void> {
    await this.recordEvent(input);
  }

  private async recordEvent(input: {
    repairOrderId: string;
    eventType: RepairEventType;
    fromStatus?: RepairStatus;
    toStatus?: RepairStatus;
    note?: string;
    performedBy: string;
  }): Promise<void> {
    await this.historyModel.create({
      repairOrderId: new Types.ObjectId(input.repairOrderId),
      eventType: input.eventType,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      note: input.note,
      performedBy: input.performedBy,
    });
  }
}
