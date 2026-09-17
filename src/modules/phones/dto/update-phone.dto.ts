import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePhoneDto } from './create-phone.dto.js';

export class UpdatePhoneDto extends PartialType(
  OmitType(CreatePhoneDto, ['customerId'] as const),
) {}
