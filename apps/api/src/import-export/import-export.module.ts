import { Module } from '@nestjs/common';
import { SchedulesModule } from '../schedules/schedules.module';
import { ImportExportController } from './import-export.controller';
import { ImportExportService } from './import-export.service';

@Module({
  imports: [SchedulesModule],
  controllers: [ImportExportController],
  providers: [ImportExportService],
})
export class ImportExportModule {}
