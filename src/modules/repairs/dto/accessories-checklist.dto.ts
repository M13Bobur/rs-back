import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class AccessoriesChecklistDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() charger?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() cable?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() simCard?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() simTray?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() case?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() memoryCard?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) other?: string;
}
