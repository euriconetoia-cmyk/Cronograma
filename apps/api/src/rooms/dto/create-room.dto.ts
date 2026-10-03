import { RoomType } from '@cronograma/database';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsEnum(RoomType)
  type!: RoomType;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsString()
  unitId!: string;
}
