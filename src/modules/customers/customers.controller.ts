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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { Permission } from '../../common/enums/permission.enum.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { CustomerResponseDto } from './dto/customer-response.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';
import { CustomersService } from './customers.service.js';
import { toCustomerResponse } from './customers.mapper.js';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Permissions(Permission.CUSTOMERS_READ)
  @ApiOkResponse({ description: 'Mijozlar ro‘yxati (sahifalangan)' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @Permissions(Permission.CUSTOMERS_READ)
  @ApiOkResponse({ type: CustomerResponseDto })
  async findOne(@Param('id') id: string): Promise<CustomerResponseDto> {
    const customer = await this.customersService.findById(id);
    return toCustomerResponse(customer);
  }

  @Post()
  @Permissions(Permission.CUSTOMERS_MANAGE)
  @ApiCreatedResponse({ type: CustomerResponseDto })
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const customer = await this.customersService.create(createCustomerDto);
    return toCustomerResponse(customer);
  }

  @Patch(':id')
  @Permissions(Permission.CUSTOMERS_MANAGE)
  @ApiOkResponse({ type: CustomerResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const customer = await this.customersService.update(id, updateCustomerDto);
    return toCustomerResponse(customer);
  }

  @Delete(':id')
  @Permissions(Permission.CUSTOMERS_MANAGE)
  @ApiOkResponse({ description: 'Mijoz o‘chirildi' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.customersService.remove(id);
    return { message: 'Mijoz muvaffaqiyatli o‘chirildi' };
  }
}
