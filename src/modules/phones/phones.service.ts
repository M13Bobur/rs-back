import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { buildPaginationMeta } from '../../common/dto/paginated-response.dto.js';
import { Customer, CustomerDocument } from '../customers/schemas/customer.schema.js';
import { CreatePhoneDto } from './dto/create-phone.dto.js';
import { PhoneResponseDto } from './dto/phone-response.dto.js';
import { PhonesQueryDto } from './dto/phones-query.dto.js';
import { UpdatePhoneDto } from './dto/update-phone.dto.js';
import { Phone, PhoneDocument } from './schemas/phone.schema.js';
import { toPhoneResponse } from './phones.mapper.js';

@Injectable()
export class PhonesService {
  constructor(
    @InjectModel(Phone.name) private readonly phoneModel: Model<PhoneDocument>,
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
  ) {}

  async findAll(query: PhonesQueryDto): Promise<{
    data: PhoneResponseDto[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const { page, limit, search, customerId } = query;
    const filter = await this.buildSearchFilter(search, customerId);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.phoneModel
        .find(filter)
        .populate('customerId', 'fullName phoneNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.phoneModel.countDocuments(filter).exec(),
    ]);

    return {
      data: items.map(toPhoneResponse),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findById(id: string): Promise<PhoneDocument> {
    const phone = await this.phoneModel
      .findById(id)
      .populate('customerId', 'fullName phoneNumber')
      .exec();

    if (!phone) {
      throw new NotFoundException('Telefon topilmadi');
    }

    return phone;
  }

  async create(createPhoneDto: CreatePhoneDto): Promise<PhoneDocument> {
    await this.ensureCustomerExists(createPhoneDto.customerId);
    await this.ensureUniqueImei(createPhoneDto.imei);

    const phone = new this.phoneModel(createPhoneDto);
    const saved = await phone.save();
    return this.findById(saved.id);
  }

  async update(id: string, updatePhoneDto: UpdatePhoneDto): Promise<PhoneDocument> {
    const existing = await this.phoneModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException('Telefon topilmadi');
    }

    if (updatePhoneDto.imei && updatePhoneDto.imei !== existing.imei) {
      await this.ensureUniqueImei(updatePhoneDto.imei, id);
    }

    const phone = await this.phoneModel
      .findByIdAndUpdate(id, updatePhoneDto, { new: true })
      .populate('customerId', 'fullName phoneNumber')
      .exec();

    if (!phone) {
      throw new NotFoundException('Telefon topilmadi');
    }

    return phone;
  }

  async remove(id: string): Promise<void> {
    const result = await this.phoneModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Telefon topilmadi');
    }
  }

  private async ensureCustomerExists(customerId: string): Promise<void> {
    const customer = await this.customerModel.findById(customerId).exec();
    if (!customer) {
      throw new NotFoundException('Mijoz topilmadi');
    }
  }

  private async ensureUniqueImei(
    imei?: string,
    excludeId?: string,
  ): Promise<void> {
    if (!imei?.trim()) {
      return;
    }

    const existing = await this.phoneModel.findOne({ imei: imei.trim() }).exec();
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Bu IMEI allaqachon mavjud');
    }
  }

  private async buildSearchFilter(
    search?: string,
    customerId?: string,
  ): Promise<Record<string, unknown>> {
    const filter: Record<string, unknown> = {};

    if (customerId) {
      filter.customerId = customerId;
    }

    if (!search?.trim()) {
      return filter;
    }

    const term = search.trim();
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const customerMatches = await this.customerModel
      .find({
        $or: [{ fullName: regex }, { phoneNumber: regex }],
      })
      .select('_id')
      .exec();

    const customerIds = customerMatches.map((c) => c._id);

    filter.$or = [
      { model: regex },
      { brand: regex },
      { imei: regex },
      ...(customerIds.length ? [{ customerId: { $in: customerIds } }] : []),
    ];

    return filter;
  }
}
