import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema.js';
import { Phone, PhoneSchema } from './schemas/phone.schema.js';
import { PhonesController } from './phones.controller.js';
import { PhonesService } from './phones.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Phone.name, schema: PhoneSchema },
      { name: Customer.name, schema: CustomerSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [PhonesController],
  providers: [PhonesService],
})
export class PhonesModule {}
