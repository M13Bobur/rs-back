import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { AccessoriesChecklistDto } from './accessories-checklist.dto.js';
import { PhysicalConditionDto } from './physical-condition.dto.js';
import { ReceptionChecklistDto } from './reception-checklist.dto.js';

export class UpdateReceptionDto {
  @ApiPropertyOptional({ type: ReceptionChecklistDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReceptionChecklistDto)
  checklist?: ReceptionChecklistDto;

  @ApiPropertyOptional({ type: PhysicalConditionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PhysicalConditionDto)
  physicalCondition?: PhysicalConditionDto;

  @ApiPropertyOptional({ type: AccessoriesChecklistDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AccessoriesChecklistDto)
  accessories?: AccessoriesChecklistDto;
}
