import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsMongoId, IsOptional, IsString } from 'class-validator';

export class AdjustInventoryDto {
  @ApiProperty()
  @IsMongoId()
  productId!: string;

  @ApiProperty({ description: 'Musbat yoki manfiy o‘zgarish' })
  @IsInt()
  quantityChange!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
