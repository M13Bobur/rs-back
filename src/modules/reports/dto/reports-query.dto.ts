import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ReportsDateRangeDto {
  @ApiPropertyOptional({ example: '2026-09-17' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-09-17' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class DailyReportQueryDto {
  @ApiPropertyOptional({ example: '2026-09-17' })
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class MonthlyReportQueryDto {
  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ example: 9, minimum: 1, maximum: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}
