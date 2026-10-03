import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@cronograma/database';
import { DatabaseService } from '../database/database.service';

interface VersionSnapshotItem {
  curricularUnitId?: string | null;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  avaEndDate?: string | null;
  totalHours?: number | null;
}

interface VersionSnapshot {
  schedule?: {
    status?: string;
  };
  items?: VersionSnapshotItem[];
}

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
        startDate: schedule.startDate?.toISOString(),
        endDate: schedule.endDate?.toISOString(),
        generatedAt: schedule.generatedAt.toISOString(),
      },
      items: schedule.items.map((item) => ({
        id: item.id,
        curricularUnitId: item.curricularUnitId,
        type: item.type,
        title: item.title,
        order: item.order,
        startDate: item.startDate.toISOString(),
        endDate: item.endDate.toISOString(),
        avaEndDate: item.avaEndDate?.toISOString(),
        totalHours: item.totalHours,
        manuallyAdjusted: item.manuallyAdjusted,
        adjustmentReason: item.adjustmentReason,
        meetings: item.meetings.map((meeting) => ({
          id: meeting.id,
          number: meeting.number,
          type: meeting.type,
          date: meeting.date.toISOString(),
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

  async compare(scheduleId: string, fromVersion: number, toVersion: number) {
    const [from, to] = await Promise.all([
      this.get(scheduleId, fromVersion),
      this.get(scheduleId, toVersion),
    ]);

    if (!from || !to) {
      throw new NotFoundException('Uma das versões informadas não foi encontrada.');
    }

    const fromSnapshot = from.snapshot as unknown as VersionSnapshot;
    const toSnapshot = to.snapshot as unknown as VersionSnapshot;
    const fromItems = new Map(
      (fromSnapshot.items ?? []).map((item) => [item.curricularUnitId ?? item.title, item]),
    );
    const toItems = new Map(
      (toSnapshot.items ?? []).map((item) => [item.curricularUnitId ?? item.title, item]),
    );

    const keys = new Set([...fromItems.keys(), ...toItems.keys()]);
    const changes = [];

    for (const key of keys) {
      const before = fromItems.get(key);
      const after = toItems.get(key);

      if (!before || !after) {
        changes.push({
          key,
          type: before ? 'REMOVED' : 'ADDED',
          before: before ?? null,
          after: after ?? null,
        });
        continue;
      }

      const fields = ['startDate', 'endDate', 'avaEndDate', 'totalHours'];
      const changedFields = fields
        .filter((field) => before[field] !== after[field])
        .map((field) => ({
          field,
          before: before[field] ?? null,
          after: after[field] ?? null,
        }));

      if (changedFields.length > 0) {
        changes.push({
          key,
          type: 'CHANGED',
          title: after.title,
          changedFields,
        });
      }
    }

    return {
      fromVersion,
      toVersion,
      statusBefore: fromSnapshot.schedule?.status,
      statusAfter: toSnapshot.schedule?.status,
      changes,
    };
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
        changes: changes ? (changes as Prisma.InputJsonValue) : undefined,
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
