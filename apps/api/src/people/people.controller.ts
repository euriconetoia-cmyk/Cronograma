import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreatePersonDto } from './dto/create-person.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { PeopleService } from './people.service';

@Controller('people')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Get()
  list() {
    return this.peopleService.list();
  }

  @Post()
  create(@Body() data: CreatePersonDto) {
    return this.peopleService.create(data);
  }

  @Get(':id/availability')
  listAvailability(@Param('id') id: string) {
    return this.peopleService.listAvailability(id);
  }

  @Post(':id/availability')
  createAvailability(
    @Param('id') id: string,
    @Body() data: CreateAvailabilityDto,
  ) {
    return this.peopleService.createAvailability(id, data);
  }
}
