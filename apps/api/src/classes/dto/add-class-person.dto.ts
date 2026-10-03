import { ClassGroupPersonRole } from '@cronograma/database';
import { IsEnum, IsString } from 'class-validator';

export class AddClassPersonDto {
  @IsString()
  personId!: string;

  @IsEnum(ClassGroupPersonRole)
  role!: ClassGroupPersonRole;
}
