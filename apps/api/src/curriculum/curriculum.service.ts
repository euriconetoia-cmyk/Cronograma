import { BadRequestException, Injectable } from '@nestjs/common';
import { validateCurricularUnitHours } from '@cronograma/validation-engine';
import { DatabaseService } from '../database/database.service';
import { CreateCourseVersionDto } from './dto/create-course-version.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateCurricularUnitDto } from './dto/create-curricular-unit.dto';

@Injectable()
export class CurriculumService {
  constructor(private readonly database: DatabaseService) {}

  listVersions(courseId?: string) {
    return this.database.courseVersion.findMany({
      where: courseId ? { courseId } : undefined,
      include: {
        course: true,
        modules: {
          include: {
            curricularUnits: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  createVersion(data: CreateCourseVersionDto) {
    return this.database.courseVersion.create({ data });
  }

  createModule(data: CreateModuleDto) {
    return this.database.courseModule.create({ data });
  }

  createCurricularUnit(data: CreateCurricularUnitDto) {
    const issues = validateCurricularUnitHours(data);
    const blockingIssue = issues.find((issue) => issue.severity === 'ERROR');

    if (blockingIssue) {
      throw new BadRequestException(blockingIssue.message);
    }

    return this.database.curricularUnit.create({ data });
  }
}
