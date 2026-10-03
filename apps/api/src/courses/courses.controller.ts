import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { CoursesService } from './courses.service';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  list() {
    return this.coursesService.list();
  }

  @Post()
  create(@Body() data: CreateCourseDto) {
    return this.coursesService.create(data);
  }
}
