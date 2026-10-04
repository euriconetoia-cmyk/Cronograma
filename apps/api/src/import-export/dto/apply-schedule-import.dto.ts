import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  Matches,
  ArrayMinSize,
  ArrayMaxSize,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { MeetingType, ScheduleItemType } from '@cronograma/database';

export class ImportScheduleRowDto {
  @IsOptional()
  @IsEnum(ScheduleItemType)
  itemType?: ScheduleItemType;

  @IsOptional()
  @IsEnum(MeetingType)
  meetingType?: MeetingType;

  @IsOptional()
  @IsInt()
  @Min(1)
  meetingHours?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  itemOrder?: number;

  @IsOptional()
  @IsString()
  curricularUnitId?: string;

  @IsOptional()
  @IsString()
  instructor?: string;

  @IsOptional()
  @IsString()
  room?: string;
  @IsString()
  curricularUnit!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalHours?: number;

  @IsDateString({ strict: true })
  startDate!: string;

  @IsDateString({ strict: true })
  endDate!: string;

  @IsOptional()
  @IsDateString({ strict: true })
  avaEndDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  meetingNumber?: number;

  @IsOptional()
  @IsDateString({ strict: true })
  meetingDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  meetingStartTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  meetingEndTime?: string;
}

export class ApplyScheduleImportDto {
  @IsString()
  classGroupId!: string;

  @IsString()
  actorName!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5000)
  @ValidateNested({ each: true })
  @Type(() => ImportScheduleRowDto)
  rows!: ImportScheduleRowDto[];
}
