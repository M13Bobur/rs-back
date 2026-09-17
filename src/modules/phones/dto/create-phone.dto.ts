import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePhoneDto {
  @ApiProperty()
  @IsMongoId()
  customerId!: string;

  @ApiProperty({ example: 'Apple' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  brand!: string;

  @ApiProperty({ example: 'iPhone 13' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  model!: string;

  @ApiPropertyOptional({ example: '356938035643809' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  imei?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  serialNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  color?: string;

  @ApiPropertyOptional({ example: '128GB' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  storage?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  batteryHealth?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
