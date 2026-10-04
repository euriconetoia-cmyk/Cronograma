import { IsDateString, Matches, IsOptional, IsString } from 'class-validator';

export class UpdateScheduleItemDto {
  @IsString()
  actorName!: string;

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate!: string;

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate!: string;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  avaEndDate?: string;

  @IsString()
  adjustmentReason!: string;
}
