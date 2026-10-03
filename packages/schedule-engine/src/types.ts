export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface CalendarRestriction {
  date: string;
  blocksAcademicActivities: boolean;
  reason?: string;
}

export interface AcademicDayContext {
  allowedWeekdays: Weekday[];
  restrictions: CalendarRestriction[];
}

export interface AcademicDayDecision {
  allowed: boolean;
  reason: 'ALLOWED' | 'WEEKDAY_NOT_ALLOWED' | 'CALENDAR_BLOCKED';
}
