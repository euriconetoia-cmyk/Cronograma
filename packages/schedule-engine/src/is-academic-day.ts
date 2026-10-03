import type { AcademicDayContext, AcademicDayDecision, Weekday } from './types';

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isAcademicDay(date: Date, context: AcademicDayContext): AcademicDayDecision {
  const weekday = date.getUTCDay() as Weekday;

  if (!context.allowedWeekdays.includes(weekday)) {
    return { allowed: false, reason: 'WEEKDAY_NOT_ALLOWED' };
  }

  const restriction = context.restrictions.find(
    (item) => item.date === toIsoDate(date) && item.blocksAcademicActivities,
  );

  if (restriction) {
    return { allowed: false, reason: 'CALENDAR_BLOCKED' };
  }

  return { allowed: true, reason: 'ALLOWED' };
}
