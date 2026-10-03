import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCurricularUnitDto {
  @IsString()
  moduleId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsInt()
  @Min(1)
  order!: number;

  @IsInt()
  @Min(1)
  totalHours!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  inPersonHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  eadHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  synchronousHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  asynchronousHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  suggestedStudyDays?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  meetingCount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  meetingHours?: number;

  @IsOptional()
  @IsBoolean()
  requiresWebClass?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresInPerson?: boolean;

  @IsOptional()
  @IsBoolean()
  recoveryEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  enrollmentPeriodDays?: number;

  @IsOptional()
  @IsBoolean()
  inauguralClass?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  avaExtraDays?: number;

  @IsOptional()
  @IsString()
  observations?: string;
}
