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
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { Permission } from '../../common/enums/permission.enum.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { CreateProductCategoryDto } from './dto/create-product-category.dto.js';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto.js';
import { ProductCategoriesService } from './product-categories.service.js';

@ApiTags('inventory-categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory/categories')
export class ProductCategoriesController {
  constructor(private readonly categoriesService: ProductCategoriesService) {}

  @Get()
  @Permissions(Permission.INVENTORY_READ)
  findAll(@Query() query: PaginationQueryDto) {
    return this.categoriesService.findAll(query);
  }

  @Get(':id')
  @Permissions(Permission.INVENTORY_READ)
  findOne(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Post()
  @Permissions(Permission.INVENTORY_MANAGE)
  create(@Body() dto: CreateProductCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @Permissions(Permission.INVENTORY_MANAGE)
  update(@Param('id') id: string, @Body() dto: UpdateProductCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions(Permission.INVENTORY_MANAGE)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id).then(() => ({
      message: 'Kategoriya o‘chirildi',
    }));
  }
}
