import { ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: getConnectionToken(),
          useValue: { readyState: 1 },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (_key: string, fallback: string) => fallback,
          },
        },
      ],
    }).compile();

    service = module.get(HealthService);
  });

  it('returns ok when MongoDB is connected', () => {
    const result = service.getHealth();

    expect(result.status).toBe('ok');
    expect(result.mongodb).toBe('connected');
    expect(result.timestamp).toBeDefined();
  });
});
