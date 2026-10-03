import { Controller, Get, Param, Post } from '@nestjs/common';
import { SchedulesService } from './schedules.service';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('class/:classGroupId/preview')
  preview(@Param('classGroupId') classGroupId: string) {
    return this.schedulesService.preview(classGroupId);
  }

  @Post('class/:classGroupId/generate')
  generate(@Param('classGroupId') classGroupId: string) {
    return this.schedulesService.generateAndSave(classGroupId);
  }

  @Get('class/:classGroupId')
  getByClass(@Param('classGroupId') classGroupId: string) {
    return this.schedulesService.getByClassGroup(classGroupId);
  }
}
