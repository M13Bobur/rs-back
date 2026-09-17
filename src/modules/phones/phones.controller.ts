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
import { Permission } from '../../common/enums/permission.enum.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { CreatePhoneDto } from './dto/create-phone.dto.js';
import { PhoneResponseDto } from './dto/phone-response.dto.js';
import { PhonesQueryDto } from './dto/phones-query.dto.js';
import { UpdatePhoneDto } from './dto/update-phone.dto.js';
import { PhonesService } from './phones.service.js';
import { toPhoneResponse } from './phones.mapper.js';

@ApiTags('phones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('phones')
export class PhonesController {
  constructor(private readonly phonesService: PhonesService) {}

  @Get()
  @Permissions(Permission.CUSTOMERS_READ)
  @ApiOkResponse({ description: 'Telefonlar ro‘yxati (sahifalangan)' })
  findAll(@Query() query: PhonesQueryDto) {
    return this.phonesService.findAll(query);
  }

  @Get(':id')
  @Permissions(Permission.CUSTOMERS_READ)
  @ApiOkResponse({ type: PhoneResponseDto })
  async findOne(@Param('id') id: string): Promise<PhoneResponseDto> {
    const phone = await this.phonesService.findById(id);
    return toPhoneResponse(phone);
  }

  @Post()
  @Permissions(Permission.CUSTOMERS_MANAGE)
  @ApiCreatedResponse({ type: PhoneResponseDto })
  async create(@Body() createPhoneDto: CreatePhoneDto): Promise<PhoneResponseDto> {
    const phone = await this.phonesService.create(createPhoneDto);
    return toPhoneResponse(phone);
  }

  @Patch(':id')
  @Permissions(Permission.CUSTOMERS_MANAGE)
  @ApiOkResponse({ type: PhoneResponseDto })
  async update(
    @Param('id') id: string,
    @Body() updatePhoneDto: UpdatePhoneDto,
  ): Promise<PhoneResponseDto> {
    const phone = await this.phonesService.update(id, updatePhoneDto);
    return toPhoneResponse(phone);
  }

  @Delete(':id')
  @Permissions(Permission.CUSTOMERS_MANAGE)
  @ApiOkResponse({ description: 'Telefon o‘chirildi' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.phonesService.remove(id);
    return { message: 'Telefon muvaffaqiyatli o‘chirildi' };
  }
}
