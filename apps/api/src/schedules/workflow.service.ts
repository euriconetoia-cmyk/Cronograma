import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ApprovalDecision, Prisma, ScheduleStatus } from '@cronograma/database';
import { lockSchedule } from './schedule-protection';
import { SchedulesService } from './schedules.service';
import { DatabaseService } from '../database/database.service';
import { VersioningService } from './versioning.service';

@Injectable()
export class WorkflowService {
  constructor(
    private readonly database: DatabaseService,
    private readonly versioning: VersioningService,
    private readonly schedulesService: SchedulesService,
  ) {}

  async submitForReview(classGroupId: string, actorName: string, comment?: string) {
    return this.transition(
      classGroupId,
      [ScheduleStatus.GENERATED, ScheduleStatus.REVIEW],
      ScheduleStatus.REVIEW,
      'SUBMIT_REVIEW',
      actorName,
      comment,
    );
  }

  async requestApproval(classGroupId: string, actorName: string, comment?: string) {
    const schedule = await this.requireSchedule(classGroupId);

    if (schedule.status !== ScheduleStatus.REVIEW) {
      throw new BadRequestException(
        'Somente cronogramas em revisão podem ser enviados para aprovação.',
      );
    }

    const updated = await this.database.$transaction(async (tx) => {
      const lockedStatus = await lockSchedule(tx, schedule.id);
      if (lockedStatus !== ScheduleStatus.REVIEW)
        throw new BadRequestException('O status foi alterado por outra operação.');
      await this.ensureNoValidationErrors(classGroupId, tx);
      const changed = await tx.schedule.updateMany({
        where: { id: schedule.id, status: ScheduleStatus.REVIEW },
        data: { status: ScheduleStatus.AWAITING_APPROVAL },
      });
      if (changed.count !== 1)
        throw new BadRequestException('O status foi alterado por outra operação. Atualize a tela.');
      const result = await tx.schedule.findUniqueOrThrow({ where: { id: schedule.id } });

      await tx.approval.create({
        data: {
          scheduleId: schedule.id,
          decision: ApprovalDecision.PENDING,
          actorName,
          comment,
        },
      });

      return result;
    });

    await this.versioning.createVersion(schedule.id, actorName, 'Enviado para aprovação');
    await this.versioning.audit('Schedule', schedule.id, 'REQUEST_APPROVAL', actorName, comment);

    return updated;
  }

  async approve(classGroupId: string, actorName: string, comment?: string) {
    return this.decide(
      classGroupId,
      ApprovalDecision.APPROVED,
      ScheduleStatus.APPROVED,
      'APPROVE',
      actorName,
      comment,
    );
  }

  async reject(classGroupId: string, actorName: string, comment?: string) {
    return this.decide(
      classGroupId,
      ApprovalDecision.REJECTED,
      ScheduleStatus.REVIEW,
      'REJECT',
      actorName,
      comment,
    );
  }

  async requestChanges(classGroupId: string, actorName: string, comment?: string) {
    return this.decide(
      classGroupId,
      ApprovalDecision.CHANGES_REQUESTED,
      ScheduleStatus.REVIEW,
      'REQUEST_CHANGES',
      actorName,
      comment,
    );
  }

  async publish(classGroupId: string, actorName: string, comment?: string) {
    return this.transition(
      classGroupId,
      [ScheduleStatus.APPROVED],
      ScheduleStatus.PUBLISHED,
      'PUBLISH',
      actorName,
      comment,
    );
  }

  async compare(classGroupId: string, fromVersion: number, toVersion: number) {
    const schedule = await this.requireSchedule(classGroupId);
    return this.versioning.compare(schedule.id, fromVersion, toVersion);
  }

  async history(classGroupId: string) {
    const schedule = await this.requireSchedule(classGroupId);

    const [versions, approvals, audit] = await Promise.all([
      this.versioning.list(schedule.id),
      this.database.approval.findMany({
        where: { scheduleId: schedule.id },
        orderBy: { createdAt: 'desc' },
      }),
      this.versioning.auditTrail('Schedule', schedule.id),
    ]);

    return {
      scheduleId: schedule.id,
      status: schedule.status,
      versions,
      approvals,
      audit,
    };
  }

  private async decide(
    classGroupId: string,
    decision: ApprovalDecision,
    nextStatus: ScheduleStatus,
    action: string,
    actorName: string,
    comment?: string,
  ) {
    const schedule = await this.requireSchedule(classGroupId);

    if (schedule.status !== ScheduleStatus.AWAITING_APPROVAL) {
      throw new BadRequestException('O cronograma não está aguardando aprovação.');
    }

    const updated = await this.database.$transaction(async (tx) => {
      const lockedStatus = await lockSchedule(tx, schedule.id);
      if (lockedStatus !== ScheduleStatus.AWAITING_APPROVAL)
        throw new BadRequestException('O status foi alterado por outra operação.');
      if (decision === ApprovalDecision.APPROVED)
        await this.ensureNoValidationErrors(classGroupId, tx);
      const changed = await tx.schedule.updateMany({
        where: { id: schedule.id, status: ScheduleStatus.AWAITING_APPROVAL },
        data: { status: nextStatus },
      });
      if (changed.count !== 1)
        throw new BadRequestException('O status foi alterado por outra operação. Atualize a tela.');
      const result = await tx.schedule.findUniqueOrThrow({ where: { id: schedule.id } });

      await tx.approval.create({
        data: {
          scheduleId: schedule.id,
          decision,
          actorName,
          comment,
        },
      });

      return result;
    });

    await this.versioning.createVersion(schedule.id, actorName, action);
    await this.versioning.audit('Schedule', schedule.id, action, actorName, comment);

    return updated;
  }

  private async transition(
    classGroupId: string,
    allowed: ScheduleStatus[],
    nextStatus: ScheduleStatus,
    action: string,
    actorName: string,
    comment?: string,
  ) {
    const schedule = await this.requireSchedule(classGroupId);

    if (!allowed.includes(schedule.status)) {
      throw new BadRequestException(
        `Transição inválida do status ${schedule.status} para ${nextStatus}.`,
      );
    }

    const updated = await this.database.$transaction(async (tx) => {
      const lockedStatus = await lockSchedule(tx, schedule.id);
      if (!allowed.includes(lockedStatus))
        throw new BadRequestException('O status foi alterado por outra operação.');
      if (nextStatus === ScheduleStatus.PUBLISHED)
        await this.ensureNoValidationErrors(classGroupId, tx);
      const changed = await tx.schedule.updateMany({
        where: { id: schedule.id, status: { in: allowed } },
        data: { status: nextStatus },
      });
      if (changed.count !== 1)
        throw new BadRequestException('O status foi alterado por outra operação. Atualize a tela.');
      return tx.schedule.findUniqueOrThrow({ where: { id: schedule.id } });
    });

    await this.versioning.createVersion(schedule.id, actorName, action);
    await this.versioning.audit('Schedule', schedule.id, action, actorName, comment);

    return updated;
  }

  private async ensureNoValidationErrors(
    classGroupId: string,
    database?: Prisma.TransactionClient,
  ) {
    const [issues, resourceIssues] = await Promise.all([
      this.schedulesService.validate(classGroupId, database),
      this.schedulesService.resourceConflicts(classGroupId, database),
    ]);
    const errors = [...issues, ...resourceIssues].filter((issue) => issue.severity === 'ERROR');
    if (errors.length) {
      throw new BadRequestException(
        `O cronograma possui ${errors.length} erro(s) e não pode avançar: ${errors.map((issue) => issue.message).join(' ')}`,
      );
    }
  }

  private async requireSchedule(classGroupId: string) {
    const schedule = await this.database.schedule.findUnique({
      where: { classGroupId },
    });

    if (!schedule) {
      throw new NotFoundException('Cronograma não encontrado.');
    }

    return schedule;
  }
}
