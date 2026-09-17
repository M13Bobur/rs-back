import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class ReceptionChecklistDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() screenWorking?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() touchWorking?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() faceId?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() fingerprint?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() frontCamera?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() rearCamera?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() flash?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() speaker?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() microphone?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() vibration?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() charging?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() wifi?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() bluetooth?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() sim?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() mobileNetwork?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() buttons?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() proximitySensor?: boolean;
}
