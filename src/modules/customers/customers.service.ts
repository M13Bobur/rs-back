import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { buildPaginationMeta } from '../../common/dto/paginated-response.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { Phone, PhoneDocument } from '../phones/schemas/phone.schema.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { CustomerResponseDto } from './dto/customer-response.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';
import { Customer, CustomerDocument } from './schemas/customer.schema.js';
import { toCustomerResponse } from './customers.mapper.js';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(Phone.name)
    private readonly phoneModel: Model<PhoneDocument>,
  ) {}

  async findAll(query: PaginationQueryDto): Promise<{
    data: CustomerResponseDto[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { page, limit, search } = query;
    const filter = this.buildSearchFilter(search);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.customerModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.customerModel.countDocuments(filter).exec(),
    ]);

    return {
      data: items.map(toCustomerResponse),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findById(id: string): Promise<CustomerDocument> {
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) {
      throw new NotFoundException('Mijoz topilmadi');
    }
    return customer;
  }

  async create(createCustomerDto: CreateCustomerDto): Promise<CustomerDocument> {
    const customer = new this.customerModel(createCustomerDto);
    return customer.save();
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerDocument> {
    const customer = await this.customerModel
      .findByIdAndUpdate(id, updateCustomerDto, { new: true })
      .exec();

    if (!customer) {
      throw new NotFoundException('Mijoz topilmadi');
    }

    return customer;
  }

  async remove(id: string): Promise<void> {
    const customer = await this.customerModel.findByIdAndDelete(id).exec();
    if (!customer) {
      throw new NotFoundException('Mijoz topilmadi');
    }
    await this.phoneModel.deleteMany({ customerId: id }).exec();
  }

  private buildSearchFilter(search?: string): Record<string, unknown> {
    if (!search?.trim()) {
      return {};
    }

    const term = search.trim();
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    return {
      $or: [{ fullName: regex }, { phoneNumber: regex }],
    };
  }
}
