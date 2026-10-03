import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { DatabaseModule } from './database/database.module';
import { UnitsModule } from './units/units.module';
import { ModalitiesModule } from './modalities/modalities.module';
import { CoursesModule } from './courses/courses.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { CalendarsModule } from './calendars/calendars.module';
import { PeopleModule } from './people/people.module';
import { ClassesModule } from './classes/classes.module';
import { SchedulesModule } from './schedules/schedules.module';
import { RoomsModule } from './rooms/rooms.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    DatabaseModule,
    UnitsModule,
    ModalitiesModule,
    CoursesModule,
    CurriculumModule,
    CalendarsModule,
    PeopleModule,
    ClassesModule,
    SchedulesModule,
    RoomsModule,
    ReportsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
