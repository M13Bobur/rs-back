import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class PhysicalConditionDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() screenCracked?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() backGlassCracked?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() frameDamaged?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() cameraGlassDamaged?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() scratches?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() waterDamage?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() missingParts?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) other?: string;
}
