import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UnitsService } from './units.service';

@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  list() {
    return this.unitsService.list();
  }

  @Post()
  create(@Body() data: CreateUnitDto) {
    return this.unitsService.create(data);
  }
}
