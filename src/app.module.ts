import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import type { StringValue } from 'ms';
import configuration from './config/configuration.js';
import { validate } from './config/env.validation.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CustomersModule } from './modules/customers/customers.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { PhonesModule } from './modules/phones/phones.module.js';
import { FinanceModule } from './modules/finance/finance.module.js';
import { SalesModule } from './modules/sales/sales.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { AlertsModule } from './modules/alerts/alerts.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { RepairsModule } from './modules/repairs/repairs.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongodb.uri'),
      }),
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.getOrThrow<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>(
            'jwt.expiresIn',
          ) as StringValue,
        },
      }),
    }),
    HealthModule,
    AuditModule,
    AuthModule,
    DashboardModule,
    UsersModule,
    CustomersModule,
    PhonesModule,
    InventoryModule,
    RepairsModule,
    FinanceModule,
    SalesModule,
    SettingsModule,
    ReportsModule,
    NotificationsModule,
    AlertsModule,
  ],
})
export class AppModule {}
