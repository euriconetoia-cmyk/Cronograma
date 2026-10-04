import type {
  AcademicDayContext,
  AcademicDayDecision,
  CalendarRestriction,
  Weekday,
} from './types';

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function includesDate(restriction: CalendarRestriction, isoDate: string): boolean {
  return isoDate >= restriction.startDate && isoDate <= restriction.endDate;
}

export function isAcademicDay(date: Date, context: AcademicDayContext): AcademicDayDecision {
  const weekday = date.getUTCDay() as Weekday;

  if (!context.allowedWeekdays.includes(weekday)) {
    return { allowed: false, reason: 'WEEKDAY_NOT_ALLOWED' };
  }

  const isoDate = toIsoDate(date);
  const restriction = context.restrictions.find(
    (item) => item.blocksAcademicActivities && includesDate(item, isoDate),
  );

  if (restriction) {
    return {
      allowed: false,
      reason: 'CALENDAR_BLOCKED',
      restriction,
    };
  }

  return { allowed: true, reason: 'ALLOWED' };
}
