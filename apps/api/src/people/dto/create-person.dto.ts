import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreatePersonDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  registry?: string;
}
