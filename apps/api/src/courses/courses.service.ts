import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCourseDto } from './dto/create-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly database: DatabaseService) {}

  list() {
    return this.database.course.findMany({
      include: {
        responsibleUnit: true,
        defaultModality: true,
        versions: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  create(data: CreateCourseDto) {
    return this.database.course.create({
      data,
      include: {
        responsibleUnit: true,
        defaultModality: true,
      },
    });
  }
}
