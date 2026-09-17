import { PhoneResponseDto } from './dto/phone-response.dto.js';
import { PhoneDocument } from './schemas/phone.schema.js';

type PopulatedCustomer = {
  _id: { toString(): string };
  fullName: string;
  phoneNumber: string;
};

export function toPhoneResponse(phone: PhoneDocument): PhoneResponseDto {
  const populated = phone.populated('customerId')
    ? (phone.customerId as unknown as PopulatedCustomer)
    : null;

  return {
    id: phone.id,
    customerId: populated
      ? populated._id.toString()
      : String(phone.customerId),
    customer: populated
      ? {
          id: populated._id.toString(),
          fullName: populated.fullName,
          phoneNumber: populated.phoneNumber,
        }
      : undefined,
    brand: phone.brand,
    model: phone.model,
    imei: phone.imei,
    serialNumber: phone.serialNumber,
    color: phone.color,
    storage: phone.storage,
    batteryHealth: phone.batteryHealth,
    notes: phone.notes,
    createdAt: phone.createdAt,
    updatedAt: phone.updatedAt,
  };
}
