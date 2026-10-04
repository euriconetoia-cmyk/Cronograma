import type { CalendarRestriction, Weekday } from './types';

export interface ScheduleRuleInput {
  weekday: Weekday;
  startTime: string;
  endTime: string;
  maxDailyHours?: number;
}

export interface CurricularUnitInput {
  id: string;
  name: string;
  order: number;
  totalHours: number;
  meetingCount: number;
  meetingHours?: number;
  requiresInPerson: boolean;
  requiresWebClass: boolean;
  recoveryEnabled: boolean;
  avaExtraDays: number;
}

export interface ModuleInput {
  id: string;
  name: string;
  order: number;
  curricularUnits: CurricularUnitInput[];
}

export interface GenerateScheduleInput {
  academicYear?: number;
  startDate: string;
  endDateLimit?: string;
  modules: ModuleInput[];
  scheduleRules: ScheduleRuleInput[];
  restrictions: CalendarRestriction[];
  classRules: {
    generateRecovery: boolean;
    avaExtraDays: number;
    allowNextUcDuringRecovery: boolean;
  };
}

export interface GeneratedMeeting {
  number: number;
  type: 'PRESENTIAL' | 'WEB_CLASS';
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
}

export interface GeneratedScheduleItem {
  type: 'CURRICULAR_UNIT' | 'RECOVERY';
  curricularUnitId?: string;
  title: string;
  order: number;
  startDate: string;
  endDate: string;
  avaEndDate?: string;
  totalHours: number;
  meetings: GeneratedMeeting[];
}

export interface GenerateScheduleResult {
  startDate: string;
  endDate: string;
  items: GeneratedScheduleItem[];
  warnings: string[];
}
