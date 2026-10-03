import { IsOptional, IsString } from 'class-validator';

export class WorkflowActionDto {
  @IsString()
  actorName!: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
