import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Weekday } from '@cronograma/database';
import { validateDateOrder, validateTimeWindow } from '@cronograma/validation-engine';
import { DatabaseService } from '../database/database.service';
import { AddClassPersonDto } from './dto/add-class-person.dto';
import { CreateClassGroupDto } from './dto/create-class-group.dto';

@Injectable()
export class ClassesService {
  constructor(private readonly database: DatabaseService) {}

  list() {
    return this.database.classGroup.findMany({
      include: {
        course: true,
        courseVersion: true,
        unit: true,
        modality: true,
        academicCalendar: true,
        scheduleRules: {
          orderBy: { weekday: 'asc' },
        },
        people: {
          include: { person: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  get(id: string) {
    return this.database.classGroup.findUnique({
      where: { id },
      include: {
        course: true,
        courseVersion: {
          include: {
            modules: {
              include: {
                curricularUnits: {
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        unit: true,
        modality: true,
        academicCalendar: {
          include: {
            events: {
              orderBy: { startDate: 'asc' },
            },
          },
        },
        scheduleRules: true,
        people: {
          include: { person: true },
        },
      },
    });
  }

  async create(data: CreateClassGroupDto) {
    const [courseVersion, calendar] = await Promise.all([
      this.database.courseVersion.findUnique({
        where: { id: data.courseVersionId },
      }),
      this.database.academicCalendar.findUnique({
        where: { id: data.academicCalendarId },
      }),
    ]);

    if (!courseVersion) {
      throw new NotFoundException('Matriz curricular não encontrada.');
    }

    if (courseVersion.courseId !== data.courseId) {
      throw new BadRequestException('A matriz selecionada não pertence ao curso informado.');
    }

    if (!calendar) {
      throw new NotFoundException('Calendário acadêmico não encontrado.');
    }

    if (calendar.unitId !== data.unitId) {
      throw new BadRequestException('O calendário selecionado não pertence à unidade da turma.');
    }

    const startDate = new Date(data.startDate);
    const endDateLimit = data.endDateLimit ? new Date(data.endDateLimit) : undefined;

    if (endDateLimit) {
      const issues = validateDateOrder(startDate, endDateLimit);
      if (issues.length > 0) {
        throw new BadRequestException(issues[0]?.message);
      }
    }

    const hasSaturday = data.scheduleRules.some((rule) => rule.weekday === Weekday.SATURDAY);
    const hasSunday = data.scheduleRules.some((rule) => rule.weekday === Weekday.SUNDAY);

    if (hasSaturday && !data.allowSaturday) {
      throw new BadRequestException('Há regra de sábado, mas a turma não permite atividades aos sábados.');
    }

    if (hasSunday && !data.allowSunday) {
      throw new BadRequestException('Há regra de domingo, mas a turma não permite atividades aos domingos.');
    }

    for (const rule of data.scheduleRules) {
      const issues = validateTimeWindow(rule.startTime, rule.endTime);
      if (issues.length > 0) {
        throw new BadRequestException(`${rule.weekday}: ${issues[0]?.message}`);
      }
    }

    const { scheduleRules, ...classData } = data;

    return this.database.classGroup.create({
      data: {
        ...classData,
        startDate,
        endDateLimit,
        scheduleRules: {
          create: scheduleRules,
        },
      },
      include: {
        course: true,
        courseVersion: true,
        unit: true,
        modality: true,
        academicCalendar: true,
        scheduleRules: true,
      },
    });
  }

  async addPerson(classGroupId: string, data: AddClassPersonDto) {
    const classGroup = await this.database.classGroup.findUnique({
      where: { id: classGroupId },
    });

    if (!classGroup) {
      throw new NotFoundException('Turma não encontrada.');
    }

    const person = await this.database.person.findUnique({
      where: { id: data.personId },
    });

    if (!person) {
      throw new NotFoundException('Pessoa não encontrada.');
    }

    return this.database.classGroupPerson.create({
      data: {
        classGroupId,
        personId: data.personId,
        role: data.role,
      },
      include: { person: true },
    });
  }

  async scheduleInput(id: string) {
    const classGroup = await this.get(id);

    if (!classGroup) {
      throw new NotFoundException('Turma não encontrada.');
    }

    return {
      classGroup: {
        id: classGroup.id,
        code: classGroup.code,
        startDate: classGroup.startDate.toISOString().slice(0, 10),
        endDateLimit: classGroup.endDateLimit?.toISOString().slice(0, 10),
        modality: classGroup.modality,
        rules: {
          generateRecovery: classGroup.generateRecovery,
          createEnrollmentPeriod: classGroup.createEnrollmentPeriod,
          createInauguralClass: classGroup.createInauguralClass,
          avaExtraDays: classGroup.avaExtraDays,
          allowSaturday: classGroup.allowSaturday,
          allowSunday: classGroup.allowSunday,
          allowOverlap: classGroup.allowOverlap,
          allowNextUcDuringRecovery: classGroup.allowNextUcDuringRecovery,
        },
      },
      matrix: classGroup.courseVersion,
      scheduleRules: classGroup.scheduleRules,
      calendarRestrictions: classGroup.academicCalendar.events.map((event) => ({
        startDate: event.startDate.toISOString().slice(0, 10),
        endDate: event.endDate.toISOString().slice(0, 10),
        blocksAcademicActivities: event.blocksAcademicActivities,
        reason: event.title,
        type: event.type,
      })),
      people: classGroup.people.map((link) => ({
        role: link.role,
        person: link.person,
      })),
    };
  }
}
