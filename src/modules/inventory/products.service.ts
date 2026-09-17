import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { buildPaginationMeta } from '../../common/dto/paginated-response.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { ProductsQueryDto } from './dto/products-query.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { toProductResponse } from './inventory.mapper.js';
import { Product, ProductDocument } from './schemas/product.schema.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async findAll(query: ProductsQueryDto) {
    const { page, limit, search, categoryId, barcode, lowStock, activeOnly } =
      query;

    if (barcode?.trim()) {
      const product = await this.productModel
        .findOne({ barcode: barcode.trim() })
        .exec();
      return {
        data: product ? [toProductResponse(product)] : [],
        meta: buildPaginationMeta(1, limit, product ? 1 : 0),
      };
    }

    const filter: Record<string, unknown> = {};
    if (categoryId) {
      filter.categoryId = categoryId;
    }
    if (activeOnly) {
      filter.isActive = true;
    }
    if (search?.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { sku: { $regex: search.trim(), $options: 'i' } },
        { barcode: { $regex: search.trim(), $options: 'i' } },
      ];
    }
    if (lowStock) {
      filter.$expr = { $lte: ['$stock', '$minimumStock'] };
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.productModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit).exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return {
      data: items.map(toProductResponse),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findById(id: string) {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi');
    }
    return toProductResponse(product);
  }

  async create(dto: CreateProductDto) {
    if (dto.stock && dto.stock > 0) {
      throw new BadRequestException(
        'Boshlang‘ich qoldiqni “Qabul qilish” orqali kiriting',
      );
    }
    const product = await this.productModel.create({
      ...dto,
      stock: dto.stock ?? 0,
    });
    return toProductResponse(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    if (dto.stock !== undefined) {
      throw new BadRequestException(
        'Qoldiqni faqat ombor harakatlari orqali o‘zgartiring',
      );
    }
    const product = await this.productModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi');
    }
    return toProductResponse(product);
  }

  async remove(id: string) {
    const product = await this.productModel.findByIdAndDelete(id).exec();
    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi');
    }
  }

  async getDocument(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi');
    }
    return product;
  }
}
