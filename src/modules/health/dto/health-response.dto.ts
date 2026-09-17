import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok' | 'degraded';

  @ApiProperty({ example: '2026-09-17T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: 'connected', enum: ['connected', 'disconnected'] })
  mongodb!: 'connected' | 'disconnected';

  @ApiProperty({ example: 'Telefon ta\'mirlash xizmati API' })
  service!: string;
}
