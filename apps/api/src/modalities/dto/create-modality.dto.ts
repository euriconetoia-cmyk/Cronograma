import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateModalityDto {
  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  allowsEad?: boolean;

  @IsOptional()
  @IsBoolean()
  allowsSynchronous?: boolean;

  @IsOptional()
  @IsBoolean()
  allowsInPersonMeetings?: boolean;

  @IsOptional()
  @IsBoolean()
  allowsWebClasses?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  defaultDailyHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  defaultAvaExtraDays?: number;
}
