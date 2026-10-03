import { Weekday } from '@cronograma/database';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class ClassScheduleRuleDto {
  @IsEnum(Weekday)
  weekday!: Weekday;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxDailyHours?: number;
}

export class CreateClassGroupDto {
  @IsString()
  code!: string;

  @IsString()
  courseId!: string;

  @IsString()
  courseVersionId!: string;

  @IsString()
  unitId!: string;

  @IsString()
  modalityId!: string;

  @IsString()
  academicCalendarId!: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDateLimit?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  expectedStudents?: number;

  @IsOptional()
  @IsBoolean()
  generateRecovery?: boolean;

  @IsOptional()
  @IsBoolean()
  createEnrollmentPeriod?: boolean;

  @IsOptional()
  @IsBoolean()
  createInauguralClass?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  avaExtraDays?: number;

  @IsOptional()
  @IsBoolean()
  allowSaturday?: boolean;

  @IsOptional()
  @IsBoolean()
  allowSunday?: boolean;

  @IsOptional()
  @IsBoolean()
  allowOverlap?: boolean;

  @IsOptional()
  @IsBoolean()
  allowNextUcDuringRecovery?: boolean;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ClassScheduleRuleDto)
  scheduleRules!: ClassScheduleRuleDto[];
}
