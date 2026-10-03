import { Weekday } from '@cronograma/database';
import { IsBoolean, IsEnum, IsOptional, Matches } from 'class-validator';

export class CreateAvailabilityDto {
  @IsEnum(Weekday)
  weekday!: Weekday;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
