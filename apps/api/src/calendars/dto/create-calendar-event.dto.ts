import { CalendarEventType } from '@cronograma/database';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateCalendarEventDto {
  @IsString()
  calendarId!: string;

  @IsEnum(CalendarEventType)
  type!: CalendarEventType;

  @IsString()
  title!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsBoolean()
  blocksAcademicActivities?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
