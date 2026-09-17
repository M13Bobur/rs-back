import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PhoneCustomerSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  phoneNumber!: string;
}

export class PhoneResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  customerId!: string;

  @ApiPropertyOptional({ type: PhoneCustomerSummaryDto })
  customer?: PhoneCustomerSummaryDto;

  @ApiProperty()
  brand!: string;

  @ApiProperty()
  model!: string;

  @ApiPropertyOptional()
  imei?: string;

  @ApiPropertyOptional()
  serialNumber?: string;

  @ApiPropertyOptional()
  color?: string;

  @ApiPropertyOptional()
  storage?: string;

  @ApiPropertyOptional()
  batteryHealth?: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
