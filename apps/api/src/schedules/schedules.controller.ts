import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UpdateScheduleItemDto } from './dto/update-schedule-item.dto';
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

  @Get('class/:classGroupId/validate')
  validate(@Param('classGroupId') classGroupId: string) {
    return this.schedulesService.validate(classGroupId);
  }

  @Patch('items/:id')
  updateItem(@Param('id') id: string, @Body() data: UpdateScheduleItemDto) {
    return this.schedulesService.updateItem(id, data);
  }

  @Get('class/:classGroupId')
  getByClass(@Param('classGroupId') classGroupId: string) {
    return this.schedulesService.getByClassGroup(classGroupId);
  }
}
