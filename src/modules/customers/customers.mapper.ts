import { CustomerResponseDto } from './dto/customer-response.dto.js';
import { CustomerDocument } from './schemas/customer.schema.js';

export function toCustomerResponse(
  customer: CustomerDocument,
): CustomerResponseDto {
  return {
    id: customer.id,
    fullName: customer.fullName,
    phoneNumber: customer.phoneNumber,
    telegramId: customer.telegramId,
    address: customer.address,
    notes: customer.notes,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}
