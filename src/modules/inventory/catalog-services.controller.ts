import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { Permission } from '../../common/enums/permission.enum.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { CreateCatalogServiceDto } from './dto/create-catalog-service.dto.js';
import { UpdateCatalogServiceDto } from './dto/update-catalog-service.dto.js';
import { CatalogServicesService } from './catalog-services.service.js';

class CatalogServicesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean;
}

@ApiTags('inventory-services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory/services')
export class CatalogServicesController {
  constructor(private readonly catalogServices: CatalogServicesService) {}

  @Get()
  @Permissions(Permission.INVENTORY_READ)
  findAll(@Query() query: CatalogServicesQueryDto) {
    return this.catalogServices.findAll(query);
  }

  @Get(':id')
  @Permissions(Permission.INVENTORY_READ)
  findOne(@Param('id') id: string) {
    return this.catalogServices.findById(id);
  }

  @Post()
  @Permissions(Permission.INVENTORY_MANAGE)
  create(@Body() dto: CreateCatalogServiceDto) {
    return this.catalogServices.create(dto);
  }

  @Patch(':id')
  @Permissions(Permission.INVENTORY_MANAGE)
  update(@Param('id') id: string, @Body() dto: UpdateCatalogServiceDto) {
    return this.catalogServices.update(id, dto);
  }

  @Delete(':id')
  @Permissions(Permission.INVENTORY_MANAGE)
  remove(@Param('id') id: string) {
    return this.catalogServices.remove(id).then(() => ({
      message: 'Xizmat o‘chirildi',
    }));
  }
}
