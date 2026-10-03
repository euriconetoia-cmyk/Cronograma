import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ApprovalDecision, ScheduleStatus } from '@cronograma/database';
import { validateResourceConflicts, validateSchedule } from '@cronograma/validation-engine';
import { DatabaseService } from '../database/database.service';
import { VersioningService } from './versioning.service';

@Injectable()
export class WorkflowService {
  constructor(
    private readonly database: DatabaseService,
    private readonly versioning: VersioningService,
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
      throw new BadRequestException('Somente cronogramas em revisão podem ser enviados para aprovação.');
    }

    await this.ensureNoValidationErrors(classGroupId);

    const updated = await this.database.$transaction(async (tx) => {
      const result = await tx.schedule.update({
        where: { id: schedule.id },
        data: { status: ScheduleStatus.AWAITING_APPROVAL },
      });

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
    await this.ensureNoValidationErrors(classGroupId);
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
      const result = await tx.schedule.update({
        where: { id: schedule.id },
        data: { status: nextStatus },
      });

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

    const updated = await this.database.schedule.update({
      where: { id: schedule.id },
      data: { status: nextStatus },
    });

    await this.versioning.createVersion(schedule.id, actorName, action);
    await this.versioning.audit('Schedule', schedule.id, action, actorName, comment);

    return updated;
  }

  private async ensureNoValidationErrors(classGroupId: string) {
    const schedule = await this.database.schedule.findUnique({
      where: { classGroupId },
      include: {
        items: {
          include: {
            curricularUnit: true,
            meetings: {
              include: {
                room: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        classGroup: {
          include: {
            academicCalendar: {
              include: { events: true },
            },
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Cronograma não encontrado.');
    }

    const issues = validateSchedule({
      endDateLimit: schedule.classGroup.endDateLimit?.toISOString().slice(0, 10),
      restrictions: schedule.classGroup.academicCalendar.events.map((event) => ({
        startDate: event.startDate.toISOString().slice(0, 10),
        endDate: event.endDate.toISOString().slice(0, 10),
        blocksAcademicActivities: event.blocksAcademicActivities,
        reason: event.title,
      })),
      items: schedule.items.map((item) => ({
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

    const resourceMeetings = schedule.items.flatMap((item) =>
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
        resourceMeetings
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

    const weekdayNumber = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
    } as const;

    const resourceIssues = validateResourceConflicts(
      resourceMeetings,
      availabilities.map((item) => ({
        personId: item.personId,
        weekday: weekdayNumber[item.weekday],
        startTime: item.startTime,
        endTime: item.endTime,
      })),
    );

    const errors = [...issues, ...resourceIssues].filter(
      (issue) => issue.severity === 'ERROR',
    );
    if (errors.length > 0) {
      throw new BadRequestException(
        `O cronograma possui ${errors.length} erro(s) de validação e não pode avançar para aprovação.`,
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
