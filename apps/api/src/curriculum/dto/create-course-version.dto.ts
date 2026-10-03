import { IsOptional, IsString } from 'class-validator';

export class CreateCourseVersionDto {
  @IsString()
  courseId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
