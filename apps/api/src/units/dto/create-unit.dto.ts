import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateUnitDto {
  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsString()
  city!: string;

  @IsString()
  @Length(2, 2)
  state!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
