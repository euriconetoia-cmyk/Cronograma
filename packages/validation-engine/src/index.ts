export interface ValidationIssue {
  code: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
}

export interface CurricularUnitHours {
  totalHours: number;
  inPersonHours?: number;
  eadHours?: number;
  synchronousHours?: number;
  asynchronousHours?: number;
}

export function validateDateOrder(start: Date, end: Date): ValidationIssue[] {
  if (end.getTime() < start.getTime()) {
    return [
      {
        code: 'END_BEFORE_START',
        severity: 'ERROR',
        message: 'A data de término não pode ser anterior à data de início.',
      },
    ];
  }

  return [];
}

export function validateCurricularUnitHours(data: CurricularUnitHours): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const presenceDistribution = (data.inPersonHours ?? 0) + (data.eadHours ?? 0);
  const syncDistribution = (data.synchronousHours ?? 0) + (data.asynchronousHours ?? 0);

  if (presenceDistribution > data.totalHours) {
    issues.push({
      code: 'UC_PRESENCE_HOURS_EXCEED_TOTAL',
      severity: 'ERROR',
      message: 'A soma das cargas presencial e EaD não pode superar a carga horária total da UC.',
    });
  }

  if (syncDistribution > data.totalHours) {
    issues.push({
      code: 'UC_SYNC_HOURS_EXCEED_TOTAL',
      severity: 'ERROR',
      message: 'A soma das cargas síncrona e assíncrona não pode superar a carga horária total da UC.',
    });
  }

  return issues;
}


export function validateTimeWindow(startTime: string, endTime: string): ValidationIssue[] {
  if (endTime <= startTime) {
    return [
      {
        code: 'END_TIME_NOT_AFTER_START',
        severity: 'ERROR',
        message: 'O horário final deve ser posterior ao horário inicial.',
      },
    ];
  }

  return [];
}


export interface ScheduleValidationMeeting {
  date: string;
  startTime: string;
  endTime: string;
}

export interface ScheduleValidationItem {
  id?: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  avaEndDate?: string;
  totalHours: number;
  expectedHours?: number;
  requiredMeetingCount?: number;
  meetings?: ScheduleValidationMeeting[];
}

export interface ScheduleValidationRestriction {
  startDate: string;
  endDate: string;
  blocksAcademicActivities: boolean;
  reason?: string;
}

export interface ValidateScheduleInput {
  items: ScheduleValidationItem[];
  restrictions?: ScheduleValidationRestriction[];
  endDateLimit?: string;
}

function dateInsideRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

export function validateSchedule(input: ValidateScheduleInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const restrictions = input.restrictions ?? [];

  if (input.items.length === 0) {
    issues.push({
      code: 'SCHEDULE_EMPTY',
      severity: 'ERROR',
      message: 'O cronograma não possui itens.',
    });
    return issues;
  }

  for (let index = 0; index < input.items.length; index += 1) {
    const item = input.items[index]!;
    const previous = input.items[index - 1];

    if (item.endDate < item.startDate) {
      issues.push({
        code: 'ITEM_END_BEFORE_START',
        severity: 'ERROR',
        message: `"${item.title}" possui término anterior ao início.`,
      });
    }

    if (item.avaEndDate && item.avaEndDate < item.endDate) {
      issues.push({
        code: 'AVA_END_BEFORE_ITEM_END',
        severity: 'ERROR',
        message: `O encerramento do AVA de "${item.title}" é anterior ao término da atividade.`,
      });
    }

    if (
      typeof item.expectedHours === 'number' &&
      item.type === 'CURRICULAR_UNIT' &&
      item.totalHours !== item.expectedHours
    ) {
      issues.push({
        code: 'UC_HOURS_MISMATCH',
        severity: 'ERROR',
        message: `A carga horária de "${item.title}" não corresponde à carga horária da UC.`,
      });
    }

    if (
      typeof item.requiredMeetingCount === 'number' &&
      (item.meetings?.length ?? 0) < item.requiredMeetingCount
    ) {
      issues.push({
        code: 'REQUIRED_MEETINGS_MISSING',
        severity: 'WARNING',
        message: `"${item.title}" possui menos encontros do que o configurado na matriz.`,
      });
    }

    for (const restriction of restrictions) {
      if (
        restriction.blocksAcademicActivities &&
        (dateInsideRange(item.startDate, restriction.startDate, restriction.endDate) ||
          dateInsideRange(item.endDate, restriction.startDate, restriction.endDate))
      ) {
        issues.push({
          code: 'ITEM_ON_BLOCKED_DATE',
          severity: 'ERROR',
          message: `"${item.title}" coincide com período bloqueado: ${restriction.reason ?? 'calendário acadêmico'}.`,
        });
        break;
      }
    }

    for (const meeting of item.meetings ?? []) {
      const blocked = restrictions.find(
        (restriction) =>
          restriction.blocksAcademicActivities &&
          dateInsideRange(meeting.date, restriction.startDate, restriction.endDate),
      );

      if (blocked) {
        issues.push({
          code: 'MEETING_ON_BLOCKED_DATE',
          severity: 'ERROR',
          message: `Encontro de "${item.title}" está em período bloqueado: ${blocked.reason ?? 'calendário acadêmico'}.`,
        });
      }

      if (validateTimeWindow(meeting.startTime, meeting.endTime).length > 0) {
        issues.push({
          code: 'MEETING_INVALID_TIME',
          severity: 'ERROR',
          message: `Encontro de "${item.title}" possui horário inválido.`,
        });
      }
    }

    if (previous && item.startDate < previous.startDate) {
      issues.push({
        code: 'ITEM_SEQUENCE_INVALID',
        severity: 'WARNING',
        message: `"${item.title}" inicia antes do item anterior na sequência.`,
      });
    }
  }

  const last = input.items[input.items.length - 1];
  if (input.endDateLimit && last && last.endDate > input.endDateLimit) {
    issues.push({
      code: 'SCHEDULE_AFTER_END_LIMIT',
      severity: 'WARNING',
      message: `O cronograma termina em ${last.endDate}, após a data limite ${input.endDateLimit}.`,
    });
  }

  return issues;
}


export interface ResourceMeeting {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  instructorId?: string | null;
  roomId?: string | null;
  roomCapacity?: number | null;
  expectedStudents?: number | null;
  title?: string;
}

export interface PersonAvailabilityWindow {
  personId: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

function timeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA < endB && startB < endA;
}

function isoWeekday(date: string): number {
  return new Date(`${date}T12:00:00.000Z`).getUTCDay();
}

export function validateResourceConflicts(
  meetings: ResourceMeeting[],
  availability: PersonAvailabilityWindow[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (let i = 0; i < meetings.length; i += 1) {
    const current = meetings[i]!;
    const sameDay = meetings.filter(
      (meeting, index) => index !== i && meeting.date === current.date,
    );

    if (current.instructorId) {
      const instructorConflict = sameDay.find(
        (meeting) =>
          meeting.instructorId === current.instructorId &&
          timeOverlap(
            current.startTime,
            current.endTime,
            meeting.startTime,
            meeting.endTime,
          ),
      );

      if (instructorConflict && current.id < instructorConflict.id) {
        issues.push({
          code: 'INSTRUCTOR_CONFLICT',
          severity: 'ERROR',
          message: `Instrutor possui encontros sobrepostos em ${current.date}.`,
        });
      }

      const windows = availability.filter(
        (window) =>
          window.personId === current.instructorId &&
          window.weekday === isoWeekday(current.date),
      );

      if (
        windows.length > 0 &&
        !windows.some(
          (window) =>
            current.startTime >= window.startTime &&
            current.endTime <= window.endTime,
        )
      ) {
        issues.push({
          code: 'INSTRUCTOR_OUTSIDE_AVAILABILITY',
          severity: 'ERROR',
          message: `Instrutor está fora da disponibilidade cadastrada em ${current.date}.`,
        });
      }
    }

    if (!current.instructorId) {
      issues.push({
        code: 'INSTRUCTOR_NOT_ASSIGNED',
        severity: 'WARNING',
        message: `Encontro de "${current.title ?? 'atividade'}" não possui instrutor definido.`,
      });
    }

    if (!current.roomId) {
      issues.push({
        code: 'ROOM_NOT_ASSIGNED',
        severity: 'WARNING',
        message: `Encontro de "${current.title ?? 'atividade'}" não possui sala ou laboratório definido.`,
      });
    }

    if (
      current.roomCapacity &&
      current.expectedStudents &&
      current.roomCapacity < current.expectedStudents
    ) {
      issues.push({
        code: 'ROOM_CAPACITY_INSUFFICIENT',
        severity: 'ERROR',
        message: `A capacidade do recurso é inferior aos ${current.expectedStudents} alunos previstos.`,
      });
    }

    if (current.roomId) {
      const roomConflict = sameDay.find(
        (meeting) =>
          meeting.roomId === current.roomId &&
          timeOverlap(
            current.startTime,
            current.endTime,
            meeting.startTime,
            meeting.endTime,
          ),
      );

      if (roomConflict && current.id < roomConflict.id) {
        issues.push({
          code: 'ROOM_CONFLICT',
          severity: 'ERROR',
          message: `Sala ou laboratório possui encontros sobrepostos em ${current.date}.`,
        });
      }
    }
  }

  return issues;
}
