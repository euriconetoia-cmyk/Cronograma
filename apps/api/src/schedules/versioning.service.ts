import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class VersioningService {
  constructor(private readonly database: DatabaseService) {}

  async createVersion(scheduleId: string, actorName: string, reason: string) {
    const schedule = await this.database.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        items: {
          include: {
            meetings: {
              orderBy: { number: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Cronograma não encontrado.');
    }

    const latest = await this.database.scheduleVersion.findFirst({
      where: { scheduleId },
      orderBy: { version: 'desc' },
    });

    const version = (latest?.version ?? 0) + 1;

    const snapshot = {
      schedule: {
        id: schedule.id,
        status: schedule.status,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        generatedAt: schedule.generatedAt,
      },
      items: schedule.items.map((item) => ({
        id: item.id,
        curricularUnitId: item.curricularUnitId,
        type: item.type,
        title: item.title,
        order: item.order,
        startDate: item.startDate,
        endDate: item.endDate,
        avaEndDate: item.avaEndDate,
        totalHours: item.totalHours,
        manuallyAdjusted: item.manuallyAdjusted,
        adjustmentReason: item.adjustmentReason,
        meetings: item.meetings.map((meeting) => ({
          id: meeting.id,
          number: meeting.number,
          type: meeting.type,
          date: meeting.date,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          hours: meeting.hours,
        })),
      })),
    };

    return this.database.scheduleVersion.create({
      data: {
        scheduleId,
        version,
        actorName,
        reason,
        snapshot,
      },
    });
  }

  list(scheduleId: string) {
    return this.database.scheduleVersion.findMany({
      where: { scheduleId },
      orderBy: { version: 'desc' },
    });
  }

  get(scheduleId: string, version: number) {
    return this.database.scheduleVersion.findUnique({
      where: {
        scheduleId_version: {
          scheduleId,
          version,
        },
      },
    });
  }

  async audit(
    entityType: string,
    entityId: string,
    action: string,
    actorName: string,
    reason?: string,
    changes?: unknown,
  ) {
    return this.database.auditLog.create({
      data: {
        entityType,
        entityId,
        action,
        actorName,
        reason,
        changes: changes as object | undefined,
      },
    });
  }

  auditTrail(entityType: string, entityId: string) {
    return this.database.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
