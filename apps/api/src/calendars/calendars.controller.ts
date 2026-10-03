import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CalendarsService } from './calendars.service';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';

@Controller('calendars')
export class CalendarsController {
  constructor(private readonly calendarsService: CalendarsService) {}

  @Get()
  list(@Query('unitId') unitId?: string, @Query('year') year?: string) {
    return this.calendarsService.list(unitId, year ? Number(year) : undefined);
  }

  @Post()
  create(@Body() data: CreateCalendarDto) {
    return this.calendarsService.create(data);
  }

  @Post('events')
  createEvent(@Body() data: CreateCalendarEventDto) {
    return this.calendarsService.createEvent(data);
  }

  @Get(':id/restrictions')
  restrictions(@Param('id') id: string) {
    return this.calendarsService.restrictions(id);
  }

  @Delete('events/:id')
  removeEvent(@Param('id') id: string) {
    return this.calendarsService.removeEvent(id);
  }
}
