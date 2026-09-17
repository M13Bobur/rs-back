import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { Permission } from '../../common/enums/permission.enum.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import {
  DailyReportQueryDto,
  MonthlyReportQueryDto,
  ReportsDateRangeDto,
} from './dto/reports-query.dto.js';
import { ReportsService } from './reports.service.js';
import { todayDateString } from './utils/report-date.util.js';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions(Permission.REPORTS_VIEW)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  overview() {
    return {
      sections: [
        { id: 'daily', path: '/reports/daily', title: 'Kunlik hisobot' },
        { id: 'monthly', path: '/reports/monthly', title: 'Oylik hisobot' },
        { id: 'inventory', path: '/reports/inventory', title: 'Ombor' },
        { id: 'technicians', path: '/reports/technicians', title: 'Ustalar' },
      ],
      defaultDate: todayDateString(),
    };
  }

  @Get('daily')
  daily(@Query() query: DailyReportQueryDto) {
    return this.reportsService.getDailyReport(query.date);
  }

  @Get('monthly')
  monthly(@Query() query: MonthlyReportQueryDto) {
    return this.reportsService.getMonthlyReport(query.year, query.month);
  }

  @Get('inventory')
  inventory(@Query() query: ReportsDateRangeDto) {
    return this.reportsService.getInventoryReport(query.dateFrom, query.dateTo);
  }

  @Get('technicians')
  technicians(@Query() query: ReportsDateRangeDto) {
    return this.reportsService.getTechnicianReport(query.dateFrom, query.dateTo);
  }
}
