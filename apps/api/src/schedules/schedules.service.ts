import { Injectable, NotFoundException } from '@nestjs/common';
import {
  MeetingType,
  ScheduleItemType,
  Weekday,
} from '@cronograma/database';
import { generateSchedule, type Weekday as EngineWeekday } from '@cronograma/schedule-engine';
import { validateDateOrder, validateSchedule } from '@cronograma/validation-engine';
import { BadRequestException } from '@nestjs/common';
import { UpdateScheduleItemDto } from './dto/update-schedule-item.dto';
import { DatabaseService } from '../database/database.service';

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
  constructor(private readonly database: DatabaseService) {}

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

  async generateAndSave(classGroupId: string) {
    const preview = await this.preview(classGroupId);

    return this.database.$transaction(async (tx) => {
      await tx.schedule.deleteMany({
        where: { classGroupId },
      });

      const schedule = await tx.schedule.create({
        data: {
          classGroupId,
          startDate: new Date(`${preview.startDate}T12:00:00.000Z`),
          endDate: new Date(`${preview.endDate}T12:00:00.000Z`),
          items: {
            create: preview.items.map((item) => ({
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
            })),
          },
        },
        include: {
          items: {
            include: {
              meetings: true,
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      await tx.classGroup.update({
        where: { id: classGroupId },
        data: { status: 'PLANNED' },
      });

      return schedule;
    });
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
    const startDate = new Date(`${data.startDate}T12:00:00.000Z`);
    const endDate = new Date(`${data.endDate}T12:00:00.000Z`);
    const issues = validateDateOrder(startDate, endDate);

    if (issues.length > 0) {
      throw new BadRequestException(issues[0]?.message);
    }

    if (data.avaEndDate) {
      const avaDate = new Date(`${data.avaEndDate}T12:00:00.000Z`);
      if (avaDate.getTime() < endDate.getTime()) {
        throw new BadRequestException('O término do AVA não pode ser anterior ao término do item.');
      }
    }

    return this.database.scheduleItem.update({
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
  }

  getByClassGroup(classGroupId: string) {
    return this.database.schedule.findUnique({
      where: { classGroupId },
      include: {
        items: {
          include: {
            curricularUnit: true,
            meetings: {
              orderBy: { number: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
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
