import { IsInt, IsString, Max, Min } from 'class-validator';

export class CreateCalendarDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @IsString()
  unitId!: string;
}
