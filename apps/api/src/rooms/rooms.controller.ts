import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomsService } from './rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  list(@Query('unitId') unitId?: string) {
    return this.roomsService.list(unitId);
  }

  @Post()
  create(@Body() data: CreateRoomDto) {
    return this.roomsService.create(data);
  }
}
