import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  dashboard(
    @Query('year') year?: string,
    @Query('unitId') unitId?: string,
  ) {
    return this.reportsService.dashboard(
      year ? Number(year) : undefined,
      unitId,
    );
  }

  @Get('annual-plan')
  annualPlan(
    @Query('year') year: string,
    @Query('unitId') unitId?: string,
  ) {
    return this.reportsService.annualPlan(Number(year), unitId);
  }

  @Get('workload')
  workload(
    @Query('year') year?: string,
    @Query('unitId') unitId?: string,
  ) {
    return this.reportsService.workload(
      year ? Number(year) : undefined,
      unitId,
    );
  }

  @Get('room-usage')
  roomUsage(
    @Query('year') year?: string,
    @Query('unitId') unitId?: string,
  ) {
    return this.reportsService.roomUsage(
      year ? Number(year) : undefined,
      unitId,
    );
  }
}
