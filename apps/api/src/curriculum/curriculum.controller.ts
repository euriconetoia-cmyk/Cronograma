import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { CreateCourseVersionDto } from './dto/create-course-version.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateCurricularUnitDto } from './dto/create-curricular-unit.dto';

@Controller('curriculum')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Get('versions')
  listVersions(@Query('courseId') courseId?: string) {
    return this.curriculumService.listVersions(courseId);
  }

  @Post('versions')
  createVersion(@Body() data: CreateCourseVersionDto) {
    return this.curriculumService.createVersion(data);
  }

  @Post('modules')
  createModule(@Body() data: CreateModuleDto) {
    return this.curriculumService.createModule(data);
  }

  @Post('units')
  createCurricularUnit(@Body() data: CreateCurricularUnitDto) {
    return this.curriculumService.createCurricularUnit(data);
  }
}
