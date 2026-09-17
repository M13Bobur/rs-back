import { RepairHistoryItemDto, RepairResponseDto } from './dto/repair-response.dto.js';
import { RepairHistoryDocument } from './schemas/repair-history.schema.js';
import { RepairOrderDocument } from './schemas/repair-order.schema.js';

type PopulatedUser = {
  _id: { toString(): string };
  fullName: string;
};

type PopulatedCustomer = PopulatedUser & { phoneNumber: string };

type PopulatedPhone = {
  _id: { toString(): string };
  brand: string;
  model: string;
  imei?: string;
};

function toPlainRecord<T extends Record<string, unknown>>(
  value: unknown,
): T | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  if ('toObject' in value && typeof value.toObject === 'function') {
    return value.toObject() as T;
  }
  return { ...(value as T) };
}

function mapUser(ref: unknown): { id: string; fullName: string } | undefined {
  if (!ref || typeof ref !== 'object' || !('_id' in ref)) {
    return undefined;
  }
  const user = ref as PopulatedUser;
  return { id: user._id.toString(), fullName: user.fullName };
}

export function toRepairResponse(
  repair: RepairOrderDocument,
  history?: RepairHistoryDocument[],
): RepairResponseDto {
  const customer = repair.populated('customerId')
    ? (repair.customerId as unknown as PopulatedCustomer)
    : null;
  const phone = repair.populated('phoneId')
    ? (repair.phoneId as unknown as PopulatedPhone)
    : null;
  const technician = repair.populated('assignedTechnicianId')
    ? mapUser(repair.assignedTechnicianId)
    : undefined;
  const creator = repair.populated('createdBy')
    ? mapUser(repair.createdBy)
    : undefined;

  return {
    id: repair.id,
    repairNumber: repair.repairNumber,
    customerId: customer
      ? customer._id.toString()
      : String(repair.customerId),
    customer: customer
      ? {
          id: customer._id.toString(),
          fullName: customer.fullName,
          phoneNumber: customer.phoneNumber,
        }
      : undefined,
    phoneId: phone ? phone._id.toString() : String(repair.phoneId),
    phone: phone
      ? {
          id: phone._id.toString(),
          brand: phone.brand,
          model: phone.model,
          imei: phone.imei,
        }
      : undefined,
    imei: repair.imei,
    reportedProblem: repair.reportedProblem,
    initialCondition: repair.initialCondition,
    diagnosticResult:
      repair.diagnostics?.diagnosticResult ?? repair.diagnosticResult,
    repairDescription: repair.repairDescription,
    assignedTechnicianId: repair.assignedTechnicianId
      ? String(repair.assignedTechnicianId)
      : undefined,
    assignedTechnician: technician,
    estimatedPrice: repair.estimatedPrice,
    finalPrice: repair.finalPrice,
    discount: repair.discount,
    paidAmount: repair.paidAmount,
    remainingAmount: repair.remainingAmount,
    paymentStatus: repair.paymentStatus,
    status: repair.status,
    customerNotes: repair.customerNotes,
    internalNotes: repair.internalNotes,
    approvalStatus: repair.approvalStatus,
    createdBy: String(repair.createdBy),
    creator,
    deliveredBy: repair.deliveredBy ? String(repair.deliveredBy) : undefined,
    deliveredAt: repair.deliveredAt,
    createdAt: repair.createdAt,
    updatedAt: repair.updatedAt,
    history: history?.map(toRepairHistoryItem),
    receptionChecklist: toPlainRecord(
      repair.receptionChecklist,
    ) as RepairResponseDto['receptionChecklist'],
    physicalConditionChecklist: toPlainRecord(
      repair.physicalConditionChecklist,
    ) as RepairResponseDto['physicalConditionChecklist'],
    accessoriesChecklist: toPlainRecord(
      repair.accessoriesChecklist,
    ) as RepairResponseDto['accessoriesChecklist'],
    photos: (repair.photos ?? []).map((photo) => ({
      id: String((photo as { _id?: { toString(): string } })._id ?? ''),
      type: photo.type,
      url: photo.url,
      originalName: photo.originalName,
      mimeType: photo.mimeType,
      size: photo.size,
      createdAt: photo.createdAt,
    })),
    diagnostics: toPlainRecord(repair.diagnostics) as RepairResponseDto['diagnostics'],
    orderServices: (repair.orderServices ?? []).map((line) => ({
      id: String((line as { _id?: { toString(): string } })._id ?? ''),
      serviceId: String(line.serviceId),
      serviceName: line.serviceName,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    })),
    orderParts: (repair.orderParts ?? []).map((line) => ({
      id: String((line as { _id?: { toString(): string } })._id ?? ''),
      productId: String(line.productId),
      productName: line.productName,
      sku: line.sku,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    })),
    servicesTotal: repair.servicesTotal ?? 0,
    partsTotal: repair.partsTotal ?? 0,
    laborAmount: repair.laborAmount ?? 0,
  };
}

export function toRepairHistoryItem(
  item: RepairHistoryDocument,
): RepairHistoryItemDto {
  const performer = item.populated('performedBy')
    ? mapUser(item.performedBy)
    : undefined;

  return {
    id: item.id,
    eventType: item.eventType,
    fromStatus: item.fromStatus,
    toStatus: item.toStatus,
    note: item.note,
    performedBy: performer ?? { id: String(item.performedBy), fullName: '—' },
    createdAt: item.createdAt,
  };
}
