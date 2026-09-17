import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RepairApprovalStatus } from '../../../common/enums/repair-approval-status.enum.js';
import { RepairPaymentStatus } from '../../../common/enums/repair-payment-status.enum.js';
import { RepairStatus } from '../../../common/enums/repair-status.enum.js';

export class RepairPersonSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;
}

export class RepairCustomerSummaryDto extends RepairPersonSummaryDto {
  @ApiProperty()
  phoneNumber!: string;
}

export class RepairPhoneSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  brand!: string;

  @ApiProperty()
  model!: string;

  @ApiPropertyOptional()
  imei?: string;
}

export class RepairHistoryItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  eventType!: string;

  @ApiPropertyOptional()
  fromStatus?: RepairStatus;

  @ApiPropertyOptional()
  toStatus?: RepairStatus;

  @ApiPropertyOptional()
  note?: string;

  @ApiProperty()
  performedBy!: RepairPersonSummaryDto;

  @ApiProperty()
  createdAt!: Date;
}

export class RepairResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  repairNumber!: string;

  @ApiProperty()
  customerId!: string;

  @ApiPropertyOptional({ type: RepairCustomerSummaryDto })
  customer?: RepairCustomerSummaryDto;

  @ApiProperty()
  phoneId!: string;

  @ApiPropertyOptional({ type: RepairPhoneSummaryDto })
  phone?: RepairPhoneSummaryDto;

  @ApiPropertyOptional()
  imei?: string;

  @ApiProperty()
  reportedProblem!: string;

  @ApiPropertyOptional()
  initialCondition?: string;

  @ApiPropertyOptional()
  diagnosticResult?: string;

  @ApiPropertyOptional()
  repairDescription?: string;

  @ApiPropertyOptional()
  assignedTechnicianId?: string;

  @ApiPropertyOptional({ type: RepairPersonSummaryDto })
  assignedTechnician?: RepairPersonSummaryDto;

  @ApiProperty()
  estimatedPrice!: number;

  @ApiPropertyOptional()
  finalPrice?: number;

  @ApiProperty()
  discount!: number;

  @ApiProperty()
  paidAmount!: number;

  @ApiProperty()
  remainingAmount!: number;

  @ApiProperty({ enum: RepairPaymentStatus })
  paymentStatus!: RepairPaymentStatus;

  @ApiProperty({ enum: RepairStatus })
  status!: RepairStatus;

  @ApiPropertyOptional()
  customerNotes?: string;

  @ApiPropertyOptional()
  internalNotes?: string;

  @ApiProperty({ enum: RepairApprovalStatus })
  approvalStatus!: RepairApprovalStatus;

  @ApiProperty()
  createdBy!: string;

  @ApiPropertyOptional({ type: RepairPersonSummaryDto })
  creator?: RepairPersonSummaryDto;

  @ApiPropertyOptional()
  deliveredBy?: string;

  @ApiPropertyOptional()
  deliveredAt?: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional({ type: [RepairHistoryItemDto] })
  history?: RepairHistoryItemDto[];

  @ApiPropertyOptional()
  receptionChecklist?: Record<string, boolean | undefined>;

  @ApiPropertyOptional()
  physicalConditionChecklist?: Record<string, boolean | string | undefined>;

  @ApiPropertyOptional()
  accessoriesChecklist?: Record<string, boolean | string | undefined>;

  @ApiPropertyOptional()
  photos?: {
    id: string;
    type: string;
    url: string;
    originalName: string;
    mimeType: string;
    size: number;
    createdAt?: Date;
  }[];

  @ApiPropertyOptional()
  diagnostics?: {
    diagnosticResult?: string;
    requiredRepairs?: string;
    requiredParts?: string;
    estimatedLabor?: number;
    estimatedTotal?: number;
    diagnosticNotes?: string;
  };

  @ApiPropertyOptional()
  orderServices?: {
    id: string;
    serviceId: string;
    serviceName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];

  @ApiPropertyOptional()
  orderParts?: {
    id: string;
    productId: string;
    productName: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];

  @ApiPropertyOptional()
  servicesTotal?: number;

  @ApiPropertyOptional()
  partsTotal?: number;

  @ApiPropertyOptional()
  laborAmount?: number;
}
