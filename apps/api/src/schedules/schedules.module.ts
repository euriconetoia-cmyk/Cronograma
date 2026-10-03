import { Module } from '@nestjs/common';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { VersioningService } from './versioning.service';
import { WorkflowService } from './workflow.service';

@Module({
  controllers: [SchedulesController],
  providers: [SchedulesService, VersioningService, WorkflowService],
  exports: [VersioningService, WorkflowService],
})
export class SchedulesModule {}
