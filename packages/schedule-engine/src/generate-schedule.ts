import { isAcademicDay } from './is-academic-day';
import type { Weekday } from './types';
import type {
  CurricularUnitInput,
  GenerateScheduleInput,
  GenerateScheduleResult,
  GeneratedMeeting,
  GeneratedScheduleItem,
  ScheduleRuleInput,
} from './engine-types';

function parseIsoDate(value: string): Date {
  return new Date(`${value}T12:00:00.000Z`);
}

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function minutes(time: string): number {
  const [hours = 0, mins = 0] = time.split(':').map(Number);
  return hours * 60 + mins;
}

function ruleHours(rule: ScheduleRuleInput): number {
  const calculated = Math.max(0, (minutes(rule.endTime) - minutes(rule.startTime)) / 60);
  if (rule.maxDailyHours) return Math.min(calculated, rule.maxDailyHours);
  return calculated;
}

function ruleForDate(date: Date, rules: ScheduleRuleInput[]): ScheduleRuleInput | undefined {
  const weekday = date.getUTCDay() as Weekday;
  return rules.find((rule) => rule.weekday === weekday);
}

function allowedWeekdays(rules: ScheduleRuleInput[]): Weekday[] {
  return rules.map((rule) => rule.weekday);
}

function nextAcademicDate(date: Date, input: GenerateScheduleInput): Date {
  let cursor = new Date(date);
  for (let guard = 0; guard < 3700; guard += 1) {
    if (input.academicYear !== undefined && cursor.getUTCFullYear() !== input.academicYear) {
      throw new Error(
        `O cronograma ultrapassa o ano letivo ${input.academicYear}. Configure o calendário do ano seguinte.`,
      );
    }
    const decision = isAcademicDay(cursor, {
      allowedWeekdays: allowedWeekdays(input.scheduleRules),
      restrictions: input.restrictions,
    });
    if (decision.allowed && ruleForDate(cursor, input.scheduleRules)) return cursor;
    cursor = addDays(cursor, 1);
  }
  throw new Error('Não foi possível localizar um dia acadêmico válido.');
}

function allocateUnit(
  unit: CurricularUnitInput,
  cursor: Date,
  input: GenerateScheduleInput,
  order: number,
): { item: GeneratedScheduleItem; nextCursor: Date } {
  let remaining = unit.totalHours;
  let day = nextAcademicDate(cursor, input);
  const startDate = isoDate(day);
  let lastDate = day;
  const usedDays: Array<{ date: Date; rule: ScheduleRuleInput; hours: number }> = [];

  while (remaining > 0) {
    const validDate = nextAcademicDate(day, input);
    const rule = ruleForDate(validDate, input.scheduleRules);
    if (!rule) throw new Error('Dia acadêmico sem regra semanal correspondente.');

    const capacity = ruleHours(rule);
    if (capacity <= 0) throw new Error(`Regra semanal inválida para ${rule.weekday}.`);

    const consumed = Math.min(remaining, capacity);
    remaining -= consumed;
    lastDate = validDate;
    usedDays.push({ date: validDate, rule, hours: consumed });
    day = addDays(validDate, 1);
  }

  const meetings: GeneratedMeeting[] = [];
  const meetingCount = Math.min(unit.meetingCount, usedDays.length);

  for (let index = 0; index < meetingCount; index += 1) {
    const used = usedDays[index];
    if (!used) continue;
    const requestedHours = unit.meetingHours ?? used.hours;
    const hours = Math.min(requestedHours, ruleHours(used.rule));
    meetings.push({
      number: index + 1,
      type: unit.requiresWebClass && !unit.requiresInPerson ? 'WEB_CLASS' : 'PRESENTIAL',
      date: isoDate(used.date),
      startTime: used.rule.startTime,
      endTime: used.rule.endTime,
      hours,
    });
  }

  const avaDays = unit.avaExtraDays + input.classRules.avaExtraDays;
  if (
    input.academicYear !== undefined &&
    addDays(lastDate, avaDays).getUTCFullYear() !== input.academicYear
  ) {
    throw new Error(
      `O encerramento do AVA ultrapassa o ano letivo ${input.academicYear}. Configure o calendário correspondente.`,
    );
  }
  const item: GeneratedScheduleItem = {
    type: 'CURRICULAR_UNIT',
    curricularUnitId: unit.id,
    title: unit.name,
    order,
    startDate,
    endDate: isoDate(lastDate),
    avaEndDate: isoDate(addDays(lastDate, avaDays)),
    totalHours: unit.totalHours,
    meetings,
  };

  return {
    item,
    nextCursor: addDays(lastDate, 1),
  };
}

export function generateSchedule(input: GenerateScheduleInput): GenerateScheduleResult {
  if (input.scheduleRules.length === 0) {
    throw new Error('A turma precisa possuir pelo menos uma regra semanal.');
  }

  const units = [...input.modules]
    .sort((a, b) => a.order - b.order)
    .flatMap((module) => [...module.curricularUnits].sort((a, b) => a.order - b.order));

  if (units.length === 0) {
    throw new Error('A matriz curricular não possui Unidades Curriculares.');
  }

  let cursor = parseIsoDate(input.startDate);
  let order = 1;
  const items: GeneratedScheduleItem[] = [];
  const warnings: string[] = [];

  for (const unit of units) {
    const allocated = allocateUnit(unit, cursor, input, order);
    items.push(allocated.item);
    order += 1;
    cursor = allocated.nextCursor;

    if (input.classRules.generateRecovery && unit.recoveryEnabled) {
      const recoveryDate = nextAcademicDate(cursor, input);
      items.push({
        type: 'RECOVERY',
        title: `Recuperação - ${unit.name}`,
        order,
        startDate: isoDate(recoveryDate),
        endDate: isoDate(recoveryDate),
        totalHours: 0,
        meetings: [],
      });
      order += 1;

      if (!input.classRules.allowNextUcDuringRecovery) {
        cursor = addDays(recoveryDate, 1);
      }

      warnings.push(
        `A recuperação de "${unit.name}" foi criada com duração padrão de 1 dia acadêmico; a duração configurável será implementada em etapa posterior.`,
      );
    }
  }

  const first = items[0];
  const last = items[items.length - 1];
  if (!first || !last) throw new Error('O motor não gerou itens.');

  if (input.endDateLimit && last.endDate > input.endDateLimit) {
    warnings.push(
      `O cronograma termina em ${last.endDate}, após a data limite ${input.endDateLimit}.`,
    );
  }

  return {
    startDate: first.startDate,
    endDate: last.endDate,
    items,
    warnings,
  };
}
