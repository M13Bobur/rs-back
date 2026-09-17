import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { RepairStatus } from '../../../common/enums/repair-status.enum.js';

export class UpdateRepairStatusDto {
  @ApiProperty({ enum: RepairStatus })
  @IsEnum(RepairStatus)
  status!: RepairStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @ApiPropertyOptional({
    description: 'Faqat ADMIN: to‘lanmagan qoldiq bilan topshirish',
  })
  @IsOptional()
  @IsBoolean()
  allowUnpaidDelivery?: boolean;
}
