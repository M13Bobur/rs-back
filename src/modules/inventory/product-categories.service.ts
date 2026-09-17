import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { buildPaginationMeta } from '../../common/dto/paginated-response.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { CreateProductCategoryDto } from './dto/create-product-category.dto.js';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto.js';
import { toCategoryResponse } from './inventory.mapper.js';
import {
  ProductCategory,
  ProductCategoryDocument,
} from './schemas/product-category.schema.js';

@Injectable()
export class ProductCategoriesService {
  constructor(
    @InjectModel(ProductCategory.name)
    private readonly categoryModel: Model<ProductCategoryDocument>,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const { page, limit, search } = query;
    const filter: Record<string, unknown> = {};
    if (search?.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.categoryModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit).exec(),
      this.categoryModel.countDocuments(filter).exec(),
    ]);
    return {
      data: items.map(toCategoryResponse),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findById(id: string) {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Kategoriya topilmadi');
    }
    return toCategoryResponse(category);
  }

  async create(dto: CreateProductCategoryDto) {
    const category = await this.categoryModel.create(dto);
    return toCategoryResponse(category);
  }

  async update(id: string, dto: UpdateProductCategoryDto) {
    const category = await this.categoryModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!category) {
      throw new NotFoundException('Kategoriya topilmadi');
    }
    return toCategoryResponse(category);
  }

  async remove(id: string) {
    const category = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!category) {
      throw new NotFoundException('Kategoriya topilmadi');
    }
  }
}
