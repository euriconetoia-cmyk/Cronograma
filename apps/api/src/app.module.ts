import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { DatabaseModule } from './database/database.module';
import { UnitsModule } from './units/units.module';
import { ModalitiesModule } from './modalities/modalities.module';
import { CoursesModule } from './courses/courses.module';
import { CurriculumModule } from './curriculum/curriculum.module';

@Module({
  imports: [
    DatabaseModule,
    UnitsModule,
    ModalitiesModule,
    CoursesModule,
    CurriculumModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
