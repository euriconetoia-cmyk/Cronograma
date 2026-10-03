import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateScheduleItemDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsDateString()
  avaEndDate?: string;

  @IsString()
  adjustmentReason!: string;
}
