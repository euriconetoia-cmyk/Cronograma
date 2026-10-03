import { BadRequestException, Injectable } from '@nestjs/common';
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

  async createCurricularUnit(data: CreateCurricularUnitDto) {
    const distributedHours =
      (data.inPersonHours ?? 0) +
      (data.eadHours ?? 0);

    if (distributedHours > data.totalHours) {
      throw new BadRequestException(
        'A soma das cargas presencial e EaD não pode superar a carga horária total da UC.',
      );
    }

    const synchronousDistribution =
      (data.synchronousHours ?? 0) +
      (data.asynchronousHours ?? 0);

    if (synchronousDistribution > data.totalHours) {
      throw new BadRequestException(
        'A soma das cargas síncrona e assíncrona não pode superar a carga horária total da UC.',
      );
    }

    return this.database.curricularUnit.create({ data });
  }
}
