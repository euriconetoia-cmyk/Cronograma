import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateModuleDto {
  @IsString()
  courseVersionId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsInt()
  @Min(1)
  order!: number;
}
