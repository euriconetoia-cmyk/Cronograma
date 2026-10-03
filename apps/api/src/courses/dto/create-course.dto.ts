import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  totalHours!: number;

  @IsOptional()
  @IsString()
  responsibleUnitId?: string;

  @IsOptional()
  @IsString()
  defaultModalityId?: string;
}
