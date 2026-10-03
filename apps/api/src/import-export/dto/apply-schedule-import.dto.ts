import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ImportScheduleRowDto {
  @IsString()
  curricularUnit!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalHours?: number;

  @IsString()
  startDate!: string;

  @IsString()
  endDate!: string;

  @IsOptional()
  @IsString()
  avaEndDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  meetingNumber?: number;

  @IsOptional()
  @IsString()
  meetingDate?: string;

  @IsOptional()
  @IsString()
  meetingStartTime?: string;

  @IsOptional()
  @IsString()
  meetingEndTime?: string;
}

export class ApplyScheduleImportDto {
  @IsString()
  classGroupId!: string;

  @IsString()
  actorName!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportScheduleRowDto)
  rows!: ImportScheduleRowDto[];
}
