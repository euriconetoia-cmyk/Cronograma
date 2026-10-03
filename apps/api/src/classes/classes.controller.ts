import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { AddClassPersonDto } from './dto/add-class-person.dto';
import { CreateClassGroupDto } from './dto/create-class-group.dto';

@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  list() {
    return this.classesService.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.classesService.get(id);
  }

  @Post()
  create(@Body() data: CreateClassGroupDto) {
    return this.classesService.create(data);
  }

  @Post(':id/people')
  addPerson(@Param('id') id: string, @Body() data: AddClassPersonDto) {
    return this.classesService.addPerson(id, data);
  }

  @Get(':id/schedule-input')
  scheduleInput(@Param('id') id: string) {
    return this.classesService.scheduleInput(id);
  }
}
