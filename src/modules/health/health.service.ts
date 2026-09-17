import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { HealthResponseDto } from './dto/health-response.dto.js';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly configService: ConfigService,
  ) {}

  getHealth(): HealthResponseDto {
    const mongoConnected = this.connection.readyState === 1;

    return {
      status: mongoConnected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      mongodb: mongoConnected ? 'connected' : 'disconnected',
      service: this.configService.get<string>('app.name', 'Recovery Service API'),
    };
  }
}
