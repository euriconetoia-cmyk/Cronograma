import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreatePersonDto } from './dto/create-person.dto';
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
}
