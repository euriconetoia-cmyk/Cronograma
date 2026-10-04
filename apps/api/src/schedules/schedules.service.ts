import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MeetingType, Prisma, ScheduleItemType, Weekday } from '@cronograma/database';
import { generateSchedule, type Weekday as EngineWeekday } from '@cronograma/schedule-engine';
import {
  validateDateOrder,
  validateResourceConflicts,
  validateSchedule,
} from '@cronograma/validation-engine';
import { DatabaseService } from '../database/database.service';
import { UpdateScheduleItemDto } from './dto/update-schedule-item.dto';
import { VersioningService } from './versioning.service';
import { AssignMeetingResourceDto } from './dto/assign-meeting-resource.dto';
import { validDate } from '../import-export/import-validation';
import { assertScheduleEditable, lockEditableSchedule } from './schedule-protection';

const weekdayMap: Record<Weekday, EngineWeekday> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

@Injectable()
export class SchedulesService {
  constructor(
    private readonly database: DatabaseService,
    private readonly versioning: VersioningService,
  ) {}

  async preview(classGroupId: string) {
    const classGroup = await this.loadClassGroup(classGroupId);
    const matrixHours = classGroup.courseVersion.modules
      .flatMap((module) => module.curricularUnits)
      .reduce((sum, unit) => sum + unit.totalHours, 0);
    if (matrixHours !== classGroup.course.totalHours) {
      throw new BadRequestException(
        `A matriz soma ${matrixHours}h de UCs; o curso exige ${classGroup.course.totalHours}h.`,
      );
    }

    const result = (() => {
      try {
        return generateSchedule({
          academicYear: classGroup.academicCalendar.year,
          startDate: classGroup.startDate.toISOString().slice(0, 10),
          endDateLimit: classGroup.endDateLimit?.toISOString().slice(0, 10),
          modules: classGroup.courseVersion.modules.map((module) => ({
            id: module.id,
            name: module.name,
            order: module.order,
            curricularUnits: module.curricularUnits.map((unit) => ({
              id: unit.id,
              name: unit.name,
              order: unit.order,
              totalHours: unit.totalHours,
              meetingCount: unit.meetingCount,
              meetingHours: unit.meetingHours ?? undefined,
              requiresInPerson: unit.requiresInPerson,
              requiresWebClass: unit.requiresWebClass,
              recoveryEnabled: unit.recoveryEnabled,
              avaExtraDays: unit.avaExtraDays,
            })),
          })),
          scheduleRules: classGroup.scheduleRules.map((rule) => ({
            weekday: weekdayMap[rule.weekday],
            startTime: rule.startTime,
            endTime: rule.endTime,
            maxDailyHours: rule.maxDailyHours ?? undefined,
          })),
          restrictions: classGroup.academicCalendar.events.map((event) => ({
            startDate: event.startDate.toISOString().slice(0, 10),
            endDate: event.endDate.toISOString().slice(0, 10),
            blocksAcademicActivities: event.blocksAcademicActivities,
            reason: event.title,
            type: event.type,
          })),
          classRules: {
            generateRecovery: classGroup.generateRecovery,
            avaExtraDays: classGroup.avaExtraDays,
            allowNextUcDuringRecovery: classGroup.allowNextUcDuringRecovery,
          },
        });
      } catch (error) {
        throw new BadRequestException(
          error instanceof Error ? error.message : 'Falha ao gerar cronograma.',
        );
      }
    })();
    const issues = validateSchedule({
      items: result.items,
      academicYear: classGroup.academicCalendar.year,
    });
    if (issues.some((issue) => issue.code === 'SCHEDULE_OUTSIDE_ACADEMIC_YEAR')) {
      throw new BadRequestException(issues.map((issue) => issue.message).join(' '));
    }
    return result;
  }

  async generateAndSave(classGroupId: string, actorName = 'Sistema') {
    const current = await this.database.schedule.findUnique({
      where: { classGroupId },
    });
    assertScheduleEditable(current?.status);
    const preview = await this.preview(classGroupId);

    if (current) {
      await this.versioning.createVersion(current.id, actorName, 'Snapshot anterior à regeneração');
    }

    const schedule = await this.database.$transaction(async (tx) => {
      if (current) {
        await lockEditableSchedule(tx, current.id);
        await tx.scheduleItem.deleteMany({
          where: { scheduleId: current.id },
        });

        return tx.schedule.update({
          where: { id: current.id },
          data: {
            status: 'GENERATED',
            generatedAt: new Date(),
            startDate: new Date(`${preview.startDate}T12:00:00.000Z`),
            endDate: new Date(`${preview.endDate}T12:00:00.000Z`),
            items: {
              create: this.toScheduleItems(preview.items),
            },
          },
          include: {
            items: {
              include: { meetings: true },
              orderBy: { order: 'asc' },
            },
          },
        });
      }

      return tx.schedule.create({
        data: {
          classGroupId,
          startDate: new Date(`${preview.startDate}T12:00:00.000Z`),
          endDate: new Date(`${preview.endDate}T12:00:00.000Z`),
          items: {
            create: this.toScheduleItems(preview.items),
          },
        },
        include: {
          items: {
            include: { meetings: true },
            orderBy: { order: 'asc' },
          },
        },
      });
    });

    await this.database.classGroup.update({
      where: { id: classGroupId },
      data: { status: 'PLANNED' },
    });

    await this.versioning.createVersion(
      schedule.id,
      actorName,
      current ? 'Cronograma regenerado' : 'Cronograma gerado',
    );
    await this.versioning.audit(
      'Schedule',
      schedule.id,
      current ? 'REGENERATE' : 'GENERATE',
      actorName,
    );

    return schedule;
  }

  async validate(classGroupId: string, database: Prisma.TransactionClient = this.database) {
    const schedule = await this.getByClassGroup(classGroupId, database);
    const classGroup = await this.loadClassGroup(classGroupId, database);

    if (!schedule) {
      throw new NotFoundException('Cronograma não encontrado.');
    }

    return validateSchedule({
      academicYear: classGroup.academicCalendar.year,
      courseTotalHours: classGroup.course.totalHours,
      matrixTotalHours: classGroup.courseVersion.modules
        .flatMap((module) => module.curricularUnits)
        .reduce((sum, unit) => sum + unit.totalHours, 0),
      endDateLimit: classGroup.endDateLimit?.toISOString().slice(0, 10),
      restrictions: classGroup.academicCalendar.events.map((event) => ({
        startDate: event.startDate.toISOString().slice(0, 10),
        endDate: event.endDate.toISOString().slice(0, 10),
        blocksAcademicActivities: event.blocksAcademicActivities,
        reason: event.title,
      })),
      items: schedule.items.map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        startDate: item.startDate.toISOString().slice(0, 10),
        endDate: item.endDate.toISOString().slice(0, 10),
        avaEndDate: item.avaEndDate?.toISOString().slice(0, 10),
        totalHours: item.totalHours,
        expectedHours: item.curricularUnit?.totalHours,
        requiredMeetingCount: item.curricularUnit?.meetingCount,
        meetings: item.meetings.map((meeting) => ({
          date: meeting.date.toISOString().slice(0, 10),
          startTime: meeting.startTime,
          endTime: meeting.endTime,
        })),
      })),
    });
  }

  async updateItem(id: string, data: UpdateScheduleItemDto) {
    const existing = await this.database.scheduleItem.findUnique({
      where: { id },
      include: {
        meetings: true,
        schedule: { include: { classGroup: { include: { academicCalendar: true } } } },
      },
    });

    if (!existing) {
      throw new NotFoundException('Item do cronograma não encontrado.');
    }
    assertScheduleEditable(existing.schedule.status);

    if (
      !validDate(data.startDate) ||
      !validDate(data.endDate) ||
      (data.avaEndDate != null && !validDate(data.avaEndDate))
    ) {
      throw new BadRequestException(
        'Data inválida no ajuste do cronograma. Use YYYY-MM-DD com uma data existente.',
      );
    }
    const startDate = new Date(`${data.startDate}T12:00:00.000Z`);
    const endDate = new Date(`${data.endDate}T12:00:00.000Z`);
    const issues = validateDateOrder(startDate, endDate);

    if (issues.length > 0) {
      throw new BadRequestException(issues[0]?.message);
    }

    const effectiveAva =
      data.avaEndDate === undefined
        ? existing.avaEndDate
        : data.avaEndDate
          ? new Date(`${data.avaEndDate}T12:00:00.000Z`)
          : null;
    if (effectiveAva) {
      const avaDate = effectiveAva;
      if (avaDate.getTime() < endDate.getTime()) {
        throw new BadRequestException('O término do AVA não pode ser anterior ao término do item.');
      }
    }
    const outside = existing.meetings.filter(
      (meeting) => meeting.date < startDate || meeting.date > endDate,
    );
    if (outside.length) {
      throw new BadRequestException(
        `${outside.length} encontro(s) ficariam fora do novo período da UC. Ajuste os encontros antes de encurtar o período.`,
      );
    }
    const year = existing.schedule.classGroup.academicCalendar.year;
    if (
      [startDate, endDate, ...(effectiveAva ? [effectiveAva] : [])].some(
        (date) => date.getUTCFullYear() !== year,
      )
    ) {
      throw new BadRequestException(
        `O período ultrapassa o ano letivo ${year}. Configure o calendário correspondente.`,
      );
    }

    const updated = await this.database.$transaction(async (tx) => {
      await lockEditableSchedule(tx, existing.scheduleId);
      return tx.scheduleItem.update({
        where: { id },
        data: {
          startDate,
          endDate,
          ...(data.avaEndDate !== undefined ? { avaEndDate: effectiveAva } : {}),
          manuallyAdjusted: true,
          adjustmentReason: data.adjustmentReason,
        },
        include: {
          curricularUnit: true,
          meetings: true,
        },
      });
    });

    await this.versioning.createVersion(existing.scheduleId, data.actorName, data.adjustmentReason);
    await this.versioning.audit(
      'Schedule',
      existing.scheduleId,
      'MANUAL_ADJUSTMENT',
      data.actorName,
      data.adjustmentReason,
      {
        itemId: id,
        startDate: data.startDate,
        endDate: data.endDate,
        avaEndDate: data.avaEndDate,
      },
    );

    return updated;
  }

  async assignMeetingResource(id: string, data: AssignMeetingResourceDto) {
    const meeting = await this.database.meeting.findUnique({
      where: { id },
      include: {
        scheduleItem: {
          include: {
            schedule: {
              include: { classGroup: true },
            },
          },
        },
      },
    });

    if (!meeting) {
      throw new NotFoundException('Encontro não encontrado.');
    }
    assertScheduleEditable(meeting.scheduleItem.schedule.status);

    if (data.roomId) {
      const room = await this.database.room.findUnique({
        where: { id: data.roomId },
      });

      if (!room) {
        throw new NotFoundException('Sala ou laboratório não encontrado.');
      }

      if (room.unitId !== meeting.scheduleItem.schedule.classGroup.unitId) {
        throw new BadRequestException('A sala ou laboratório não pertence à unidade da turma.');
      }
    }

    if (data.instructorId) {
      const instructor = await this.database.person.findUnique({
        where: { id: data.instructorId },
      });

      if (!instructor) {
        throw new NotFoundException('Instrutor não encontrado.');
      }
    }

    const updated = await this.database.$transaction(async (tx) => {
      await lockEditableSchedule(tx, meeting.scheduleItem.scheduleId);
      return tx.meeting.update({
        where: { id },
        data,
        include: {
          instructor: true,
          room: true,
        },
      });
    });

    await this.versioning.audit(
      'Schedule',
      meeting.scheduleItem.scheduleId,
      'ASSIGN_MEETING_RESOURCE',
      'Sistema',
      undefined,
      {
        meetingId: id,
        instructorId: data.instructorId,
        roomId: data.roomId,
      },
    );

    return updated;
  }

  async resourceConflicts(
    classGroupId: string,
    database: Prisma.TransactionClient = this.database,
  ) {
    const schedule = await database.schedule.findUnique({
      where: { classGroupId },
      include: {
        classGroup: true,
        items: {
          include: {
            meetings: {
              include: {
                room: true,
                instructor: true,
              },
            },
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Cronograma não encontrado.');
    }

    const meetings = schedule.items.flatMap((item) =>
      item.meetings.map((meeting) => ({
        id: meeting.id,
        title: item.title,
        date: meeting.date.toISOString().slice(0, 10),
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        instructorId: meeting.instructorId,
        roomId: meeting.roomId,
        roomCapacity: meeting.room?.capacity,
        expectedStudents: schedule.classGroup.expectedStudents,
        classCode: schedule.classGroup.code,
        instructorName: meeting.instructor?.name,
        roomName: meeting.room?.name,
      })),
    );
    const ownIds = new Set(meetings.map((meeting) => meeting.id));
    const externalMeetings = meetings.length
      ? await database.meeting.findMany({
          where: {
            scheduleItem: {
              scheduleId: { not: schedule.id },
              schedule: { classGroup: { status: { not: 'CANCELLED' } } },
            },
            date: {
              in: [...new Set(meetings.map((meeting) => meeting.date))].map(
                (date) => new Date(`${date}T12:00:00.000Z`),
              ),
            },
            OR: [
              {
                instructorId: {
                  in: meetings.flatMap((meeting) =>
                    meeting.instructorId ? [meeting.instructorId] : [],
                  ),
                },
              },
              {
                roomId: {
                  in: meetings.flatMap((meeting) => (meeting.roomId ? [meeting.roomId] : [])),
                },
              },
            ],
          },
          include: {
            instructor: true,
            room: true,
            scheduleItem: { include: { schedule: { include: { classGroup: true } } } },
          },
        })
      : [];
    const allMeetings = [
      ...meetings,
      ...externalMeetings.map((meeting) => ({
        id: meeting.id,
        title: meeting.scheduleItem.title,
        date: meeting.date.toISOString().slice(0, 10),
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        instructorId: meeting.instructorId,
        roomId: meeting.roomId,
        roomCapacity: meeting.room?.capacity,
        expectedStudents: meeting.scheduleItem.schedule.classGroup.expectedStudents,
        classCode: meeting.scheduleItem.schedule.classGroup.code,
        instructorName: meeting.instructor?.name,
        roomName: meeting.room?.name,
      })),
    ];

    const instructorIds = [
      ...new Set(
        meetings.map((meeting) => meeting.instructorId).filter((id): id is string => Boolean(id)),
      ),
    ];

    const availabilities = instructorIds.length
      ? await database.personAvailability.findMany({
          where: {
            personId: { in: instructorIds },
            active: true,
          },
        })
      : [];

    const weekdayNumber: Record<Weekday, number> = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
    };

    return validateResourceConflicts(
      allMeetings,
      availabilities.map((item) => ({
        personId: item.personId,
        weekday: weekdayNumber[item.weekday],
        startTime: item.startTime,
        endTime: item.endTime,
      })),
    ).filter((issue) => issue.meetingIds?.some((id) => ownIds.has(id)));
  }

  getByClassGroup(classGroupId: string, database: Prisma.TransactionClient = this.database) {
    return database.schedule.findUnique({
      where: { classGroupId },
      include: {
        items: {
          include: {
            curricularUnit: true,
            meetings: {
              include: {
                instructor: true,
                room: true,
              },
              orderBy: { number: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  private toScheduleItems(items: Awaited<ReturnType<typeof this.preview>>['items']) {
    return items.map((item) => ({
      curricularUnitId: item.curricularUnitId,
      type:
        item.type === 'CURRICULAR_UNIT'
          ? ScheduleItemType.CURRICULAR_UNIT
          : ScheduleItemType.RECOVERY,
      title: item.title,
      order: item.order,
      startDate: new Date(`${item.startDate}T12:00:00.000Z`),
      endDate: new Date(`${item.endDate}T12:00:00.000Z`),
      avaEndDate: item.avaEndDate ? new Date(`${item.avaEndDate}T12:00:00.000Z`) : undefined,
      totalHours: item.totalHours,
      meetings: {
        create: item.meetings.map((meeting) => ({
          number: meeting.number,
          type: meeting.type === 'WEB_CLASS' ? MeetingType.WEB_CLASS : MeetingType.PRESENTIAL,
          date: new Date(`${meeting.date}T12:00:00.000Z`),
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          hours: meeting.hours,
        })),
      },
    }));
  }

  private async loadClassGroup(id: string, database: Prisma.TransactionClient = this.database) {
    const classGroup = await database.classGroup.findUnique({
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
        academicCalendar: {
          include: {
            events: {
              orderBy: { startDate: 'asc' },
            },
          },
        },
        scheduleRules: true,
      },
    });

    if (!classGroup) {
      throw new NotFoundException('Turma não encontrada.');
    }

    return classGroup;
  }
}
