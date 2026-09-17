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
import { CreateProductDto } from './dto/create-product.dto.js';
import { ProductsQueryDto } from './dto/products-query.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductsService } from './products.service.js';

@ApiTags('inventory-products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Permissions(Permission.INVENTORY_READ)
  findAll(@Query() query: ProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @Permissions(Permission.INVENTORY_READ)
  findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  @Permissions(Permission.INVENTORY_MANAGE)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @Permissions(Permission.INVENTORY_MANAGE)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions(Permission.INVENTORY_MANAGE)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id).then(() => ({
      message: 'Mahsulot o‘chirildi',
    }));
  }
}
