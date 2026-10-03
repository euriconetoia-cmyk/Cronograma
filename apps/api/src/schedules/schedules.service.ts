import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  MeetingType,
  ScheduleItemType,
  Weekday,
} from '@cronograma/database';
import { generateSchedule, type Weekday as EngineWeekday } from '@cronograma/schedule-engine';
import { validateDateOrder, validateResourceConflicts, validateSchedule } from '@cronograma/validation-engine';
import { DatabaseService } from '../database/database.service';
import { UpdateScheduleItemDto } from './dto/update-schedule-item.dto';
import { VersioningService } from './versioning.service';
import { AssignMeetingResourceDto } from './dto/assign-meeting-resource.dto';

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

    return generateSchedule({
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
  }

  async generateAndSave(classGroupId: string, actorName = 'Sistema') {
    const preview = await this.preview(classGroupId);
    const current = await this.database.schedule.findUnique({
      where: { classGroupId },
    });

    if (current) {
      await this.versioning.createVersion(
        current.id,
        actorName,
        'Snapshot anterior à regeneração',
      );
    }

    const schedule = await this.database.$transaction(async (tx) => {
      if (current) {
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

  async validate(classGroupId: string) {
    const schedule = await this.getByClassGroup(classGroupId);
    const classGroup = await this.loadClassGroup(classGroupId);

    if (!schedule) {
      throw new NotFoundException('Cronograma não encontrado.');
    }

    return validateSchedule({
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
    });

    if (!existing) {
      throw new NotFoundException('Item do cronograma não encontrado.');
    }

    const startDate = new Date(`${data.startDate}T12:00:00.000Z`);
    const endDate = new Date(`${data.endDate}T12:00:00.000Z`);
    const issues = validateDateOrder(startDate, endDate);

    if (issues.length > 0) {
      throw new BadRequestException(issues[0]?.message);
    }

    if (data.avaEndDate) {
      const avaDate = new Date(`${data.avaEndDate}T12:00:00.000Z`);
      if (avaDate.getTime() < endDate.getTime()) {
        throw new BadRequestException(
          'O término do AVA não pode ser anterior ao término do item.',
        );
      }
    }

    const updated = await this.database.scheduleItem.update({
      where: { id },
      data: {
        startDate,
        endDate,
        avaEndDate: data.avaEndDate
          ? new Date(`${data.avaEndDate}T12:00:00.000Z`)
          : null,
        manuallyAdjusted: true,
        adjustmentReason: data.adjustmentReason,
      },
      include: {
        curricularUnit: true,
        meetings: true,
      },
    });

    await this.versioning.createVersion(
      existing.scheduleId,
      data.actorName,
      data.adjustmentReason,
    );
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

    if (data.roomId) {
      const room = await this.database.room.findUnique({
        where: { id: data.roomId },
      });

      if (!room) {
        throw new NotFoundException('Sala ou laboratório não encontrado.');
      }

      if (room.unitId !== meeting.scheduleItem.schedule.classGroup.unitId) {
        throw new BadRequestException(
          'A sala ou laboratório não pertence à unidade da turma.',
        );
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

    const updated = await this.database.meeting.update({
      where: { id },
      data,
      include: {
        instructor: true,
        room: true,
      },
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

  async resourceConflicts(classGroupId: string) {
    const schedule = await this.database.schedule.findUnique({
      where: { classGroupId },
      include: {
        classGroup: true,
        items: {
          include: {
            meetings: {
              include: {
                room: true,
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
      })),
    );

    const instructorIds = [
      ...new Set(
        meetings
          .map((meeting) => meeting.instructorId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const availabilities = instructorIds.length
      ? await this.database.personAvailability.findMany({
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
      meetings,
      availabilities.map((item) => ({
        personId: item.personId,
        weekday: weekdayNumber[item.weekday],
        startTime: item.startTime,
        endTime: item.endTime,
      })),
    );
  }

  getByClassGroup(classGroupId: string) {
    return this.database.schedule.findUnique({
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
      avaEndDate: item.avaEndDate
        ? new Date(`${item.avaEndDate}T12:00:00.000Z`)
        : undefined,
      totalHours: item.totalHours,
      meetings: {
        create: item.meetings.map((meeting) => ({
          number: meeting.number,
          type:
            meeting.type === 'WEB_CLASS'
              ? MeetingType.WEB_CLASS
              : MeetingType.PRESENTIAL,
          date: new Date(`${meeting.date}T12:00:00.000Z`),
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          hours: meeting.hours,
        })),
      },
    }));
  }

  private async loadClassGroup(id: string) {
    const classGroup = await this.database.classGroup.findUnique({
      where: { id },
      include: {
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
