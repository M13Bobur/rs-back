import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StaffAlertsService } from './staff-alerts.service.js';

@Injectable()
export class StaffAlertsScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StaffAlertsScheduler.name);
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(
    private readonly staffAlertsService: StaffAlertsService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const intervalMs =
      this.configService.get<number>('alerts.scanIntervalMs') ?? 30 * 60 * 1000;
    void this.runScan();
    this.timer = setInterval(() => void this.runScan(), intervalMs);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async runScan() {
    try {
      await this.staffAlertsService.runScheduledChecks({
        overdueDays: this.configService.get<number>('alerts.overdueRepairDays') ?? 7,
        largeDebtThreshold:
          this.configService.get<number>('alerts.largeDebtThreshold') ?? 5_000_000,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(`Alert scan failed: ${message}`);
    }
  }
}
