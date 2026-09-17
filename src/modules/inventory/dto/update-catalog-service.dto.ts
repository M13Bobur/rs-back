import { PartialType } from '@nestjs/swagger';
import { CreateCatalogServiceDto } from './create-catalog-service.dto.js';

export class UpdateCatalogServiceDto extends PartialType(
  CreateCatalogServiceDto,
) {}
