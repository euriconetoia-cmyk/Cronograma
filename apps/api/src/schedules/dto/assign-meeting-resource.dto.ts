import { IsOptional, IsString } from 'class-validator';

export class AssignMeetingResourceDto {
  @IsOptional()
  @IsString()
  instructorId?: string;

  @IsOptional()
  @IsString()
  roomId?: string;
}
