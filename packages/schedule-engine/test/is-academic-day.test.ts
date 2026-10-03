import { describe, expect, it } from 'vitest';
import { isAcademicDay } from '../src/is-academic-day';

describe('isAcademicDay', () => {
  const allowedWeekdays = [1, 2, 3, 4, 5] as const;

  it('aceita dia configurado sem bloqueio', () => {
    const decision = isAcademicDay(new Date('2027-03-01T12:00:00Z'), {
      allowedWeekdays: [...allowedWeekdays],
      restrictions: [],
    });

    expect(decision).toEqual({ allowed: true, reason: 'ALLOWED' });
  });

  it('rejeita dia da semana não permitido', () => {
    const decision = isAcademicDay(new Date('2027-03-06T12:00:00Z'), {
      allowedWeekdays: [...allowedWeekdays],
      restrictions: [],
    });

    expect(decision.reason).toBe('WEEKDAY_NOT_ALLOWED');
  });

  it('rejeita qualquer data dentro de um período bloqueado', () => {
    const decision = isAcademicDay(new Date('2027-03-03T12:00:00Z'), {
      allowedWeekdays: [...allowedWeekdays],
      restrictions: [
        {
          startDate: '2027-03-01',
          endDate: '2027-03-05',
          blocksAcademicActivities: true,
          reason: 'Recesso',
          type: 'RECESS',
        },
      ],
    });

    expect(decision.reason).toBe('CALENDAR_BLOCKED');
    expect(decision.restriction?.reason).toBe('Recesso');
  });

  it('não bloqueia evento apenas informativo', () => {
    const decision = isAcademicDay(new Date('2027-03-03T12:00:00Z'), {
      allowedWeekdays: [...allowedWeekdays],
      restrictions: [
        {
          startDate: '2027-03-03',
          endDate: '2027-03-03',
          blocksAcademicActivities: false,
          reason: 'Evento institucional',
          type: 'INSTITUTIONAL_EVENT',
        },
      ],
    });

    expect(decision.reason).toBe('ALLOWED');
  });
});
