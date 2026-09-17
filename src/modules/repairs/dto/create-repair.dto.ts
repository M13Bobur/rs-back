import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { RepairApprovalStatus } from '../../../common/enums/repair-approval-status.enum.js';
import { UpdateReceptionDto } from './update-reception.dto.js';

export class CreateRepairDto {
  @ApiProperty()
  @IsMongoId()
  customerId!: string;

  @ApiProperty()
  @IsMongoId()
  phoneId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  imei?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reportedProblem!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  initialCondition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  assignedTechnicianId?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  customerNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNotes?: string;

  @ApiPropertyOptional({ enum: RepairApprovalStatus })
  @IsOptional()
  @IsEnum(RepairApprovalStatus)
  approvalStatus?: RepairApprovalStatus;

  @ApiPropertyOptional({ type: UpdateReceptionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateReceptionDto)
  reception?: UpdateReceptionDto;
}
