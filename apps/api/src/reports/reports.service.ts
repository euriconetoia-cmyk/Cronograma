import { Injectable } from '@nestjs/common';
import { Weekday } from '@cronograma/database';
import { validateResourceConflicts } from '@cronograma/validation-engine';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ReportsService {
  constructor(private readonly database: DatabaseService) {}

  async dashboard(year?: number, unitId?: string) {
    const classWhere = {
      ...(unitId ? { unitId } : {}),
      ...(year
        ? {
            startDate: {
              gte: new Date(`${year}-01-01T00:00:00.000Z`),
              lte: new Date(`${year}-12-31T23:59:59.999Z`),
            },
          }
        : {}),
    };

    const [
      classes,
      courses,
      schedules,
      rooms,
      people,
    ] = await Promise.all([
      this.database.classGroup.findMany({
        where: classWhere,
        include: {
          course: true,
          unit: true,
          modality: true,
          schedule: {
            include: {
              items: true,
            },
          },
        },
      }),
      this.database.course.count({
        where: { status: 'ACTIVE' },
      }),
      this.database.schedule.findMany({
        where: {
          classGroup: classWhere,
        },
        include: {
          classGroup: true,
          items: {
            include: {
              meetings: true,
            },
          },
        },
      }),
      this.database.room.count({
        where: {
          active: true,
          ...(unitId ? { unitId } : {}),
        },
      }),
      this.database.person.count({
        where: { active: true },
      }),
    ]);

    const byStatus = classes.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    }, {});

    const byModality = classes.reduce<Record<string, number>>((acc, item) => {
      acc[item.modality.name] = (acc[item.modality.name] ?? 0) + 1;
      return acc;
    }, {});

    const byUnit = classes.reduce<Record<string, number>>((acc, item) => {
      acc[item.unit.name] = (acc[item.unit.name] ?? 0) + 1;
      return acc;
    }, {});

    const plannedHours = classes.reduce(
      (sum, item) => sum + item.course.totalHours,
      0,
    );

    const totalMeetings = schedules.reduce(
      (sum, schedule) =>
        sum +
        schedule.items.reduce(
          (itemSum, item) => itemSum + item.meetings.length,
          0,
        ),
      0,
    );

    const conflicts = await this.conflicts(year, unitId);

    return {
      filters: { year: year ?? null, unitId: unitId ?? null },
      totals: {
        classes: classes.length,
        courses,
        plannedHours,
        schedules: schedules.length,
        rooms,
        people,
        meetings: totalMeetings,
        conflicts: conflicts.summary.total,
        criticalConflicts: conflicts.summary.errors,
      },
      classesByStatus: byStatus,
      classesByModality: byModality,
      classesByUnit: byUnit,
      schedulesByStatus: schedules.reduce<Record<string, number>>((acc, item) => {
        acc[item.status] = (acc[item.status] ?? 0) + 1;
        return acc;
      }, {}),
    };
  }

  async annualPlan(year: number, unitId?: string) {
    const classes = await this.database.classGroup.findMany({
      where: {
        ...(unitId ? { unitId } : {}),
        startDate: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lte: new Date(`${year}-12-31T23:59:59.999Z`),
        },
      },
      include: {
        course: true,
        unit: true,
        modality: true,
        schedule: true,
      },
      orderBy: { startDate: 'asc' },
    });

    const months = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      classes: 0,
      plannedHours: 0,
      schedules: 0,
      items: [] as Array<{
        id: string;
        code: string;
        course: string;
        unit: string;
        modality: string;
        startDate: string;
        endDate?: string;
        status: string;
      }>,
    }));

    for (const item of classes) {
      const monthIndex = item.startDate.getUTCMonth();
      const month = months[monthIndex]!;
      month.classes += 1;
      month.plannedHours += item.course.totalHours;
      if (item.schedule) month.schedules += 1;
      month.items.push({
        id: item.id,
        code: item.code,
        course: item.course.name,
        unit: item.unit.name,
        modality: item.modality.name,
        startDate: item.startDate.toISOString().slice(0, 10),
        endDate: item.schedule?.endDate?.toISOString().slice(0, 10),
        status: item.status,
      });
    }

    return {
      year,
      unitId: unitId ?? null,
      totals: {
        classes: classes.length,
        plannedHours: classes.reduce((sum, item) => sum + item.course.totalHours, 0),
        schedules: classes.filter((item) => item.schedule).length,
      },
      months,
    };
  }

  async conflicts(year?: number, unitId?: string) {
    const meetings = await this.database.meeting.findMany({
      where: {
        scheduleItem: {
          schedule: {
            classGroup: {
              ...(unitId ? { unitId } : {}),
              ...(year
                ? {
                    startDate: {
                      gte: new Date(`${year}-01-01T00:00:00.000Z`),
                      lte: new Date(`${year}-12-31T23:59:59.999Z`),
                    },
                  }
                : {}),
            },
          },
        },
      },
      include: {
        room: true,
        instructor: true,
        scheduleItem: {
          include: {
            schedule: {
              include: {
                classGroup: true,
              },
            },
          },
        },
      },
    });

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

    const issues = validateResourceConflicts(
      meetings.map((meeting) => ({
        id: meeting.id,
        title: meeting.scheduleItem.title,
        date: meeting.date.toISOString().slice(0, 10),
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        instructorId: meeting.instructorId,
        roomId: meeting.roomId,
        roomCapacity: meeting.room?.capacity,
        expectedStudents: meeting.scheduleItem.schedule.classGroup.expectedStudents,
      })),
      availabilities.map((item) => ({
        personId: item.personId,
        weekday: weekdayNumber[item.weekday],
        startTime: item.startTime,
        endTime: item.endTime,
      })),
    );

    return {
      summary: {
        total: issues.length,
        errors: issues.filter((issue) => issue.severity === 'ERROR').length,
        warnings: issues.filter((issue) => issue.severity === 'WARNING').length,
      },
      byCode: issues.reduce<Record<string, number>>((acc, issue) => {
        acc[issue.code] = (acc[issue.code] ?? 0) + 1;
        return acc;
      }, {}),
      issues,
    };
  }

  async workload(year?: number, unitId?: string) {
    const meetings = await this.database.meeting.findMany({
      where: {
        instructorId: { not: null },
        scheduleItem: {
          schedule: {
            classGroup: {
              ...(unitId ? { unitId } : {}),
              ...(year
                ? {
                    startDate: {
                      gte: new Date(`${year}-01-01T00:00:00.000Z`),
                      lte: new Date(`${year}-12-31T23:59:59.999Z`),
                    },
                  }
                : {}),
            },
          },
        },
      },
      include: {
        instructor: true,
      },
    });

    const grouped = new Map<string, {
      instructorId: string;
      name: string;
      hours: number;
      meetings: number;
    }>();

    for (const meeting of meetings) {
      if (!meeting.instructor) continue;
      const current = grouped.get(meeting.instructor.id) ?? {
        instructorId: meeting.instructor.id,
        name: meeting.instructor.name,
        hours: 0,
        meetings: 0,
      };
      current.hours += meeting.hours;
      current.meetings += 1;
      grouped.set(meeting.instructor.id, current);
    }

    return [...grouped.values()].sort((a, b) => b.hours - a.hours);
  }

  async roomUsage(year?: number, unitId?: string) {
    const meetings = await this.database.meeting.findMany({
      where: {
        roomId: { not: null },
        room: {
          ...(unitId ? { unitId } : {}),
        },
        scheduleItem: {
          schedule: {
            classGroup: {
              ...(year
                ? {
                    startDate: {
                      gte: new Date(`${year}-01-01T00:00:00.000Z`),
                      lte: new Date(`${year}-12-31T23:59:59.999Z`),
                    },
                  }
                : {}),
            },
          },
        },
      },
      include: {
        room: true,
      },
    });

    const grouped = new Map<string, {
      roomId: string;
      name: string;
      code: string;
      hours: number;
      meetings: number;
    }>();

    for (const meeting of meetings) {
      if (!meeting.room) continue;
      const current = grouped.get(meeting.room.id) ?? {
        roomId: meeting.room.id,
        name: meeting.room.name,
        code: meeting.room.code,
        hours: 0,
        meetings: 0,
      };
      current.hours += meeting.hours;
      current.meetings += 1;
      grouped.set(meeting.room.id, current);
    }

    return [...grouped.values()].sort((a, b) => b.hours - a.hours);
  }
}
