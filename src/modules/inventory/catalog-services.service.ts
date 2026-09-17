import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { buildPaginationMeta } from '../../common/dto/paginated-response.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { CreateCatalogServiceDto } from './dto/create-catalog-service.dto.js';
import { UpdateCatalogServiceDto } from './dto/update-catalog-service.dto.js';
import { toCatalogServiceResponse } from './inventory.mapper.js';
import {
  RepairCatalogService,
  RepairCatalogServiceDocument,
} from './schemas/repair-catalog-service.schema.js';

@Injectable()
export class CatalogServicesService {
  constructor(
    @InjectModel(RepairCatalogService.name)
    private readonly serviceModel: Model<RepairCatalogServiceDocument>,
  ) {}

  async findAll(query: PaginationQueryDto & { activeOnly?: boolean }) {
    const { page, limit, search, activeOnly } = query;
    const filter: Record<string, unknown> = {};
    if (search?.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }
    if (activeOnly) {
      filter.isActive = true;
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.serviceModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit).exec(),
      this.serviceModel.countDocuments(filter).exec(),
    ]);
    return {
      data: items.map(toCatalogServiceResponse),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findById(id: string) {
    const service = await this.serviceModel.findById(id).exec();
    if (!service) {
      throw new NotFoundException('Xizmat topilmadi');
    }
    return toCatalogServiceResponse(service);
  }

  async create(dto: CreateCatalogServiceDto) {
    const service = await this.serviceModel.create(dto);
    return toCatalogServiceResponse(service);
  }

  async update(id: string, dto: UpdateCatalogServiceDto) {
    const service = await this.serviceModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!service) {
      throw new NotFoundException('Xizmat topilmadi');
    }
    return toCatalogServiceResponse(service);
  }

  async remove(id: string) {
    const service = await this.serviceModel.findByIdAndDelete(id).exec();
    if (!service) {
      throw new NotFoundException('Xizmat topilmadi');
    }
  }

  async getDocument(id: string): Promise<RepairCatalogServiceDocument> {
    const service = await this.serviceModel.findById(id).exec();
    if (!service) {
      throw new NotFoundException('Xizmat topilmadi');
    }
    return service;
  }
}
