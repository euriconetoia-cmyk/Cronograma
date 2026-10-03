import { describe, expect, it } from 'vitest';
import { isAcademicDay } from '../src/is-academic-day';

describe('isAcademicDay', () => {
  const allowedWeekdays = [1, 3, 5] as const;

  it('aceita uma segunda-feira configurada', () => {
    const decision = isAcademicDay(new Date('2027-03-01T12:00:00Z'), {
      allowedWeekdays: [...allowedWeekdays],
      restrictions: [],
    });

    expect(decision).toEqual({ allowed: true, reason: 'ALLOWED' });
  });

  it('rejeita um dia da semana não permitido', () => {
    const decision = isAcademicDay(new Date('2027-03-02T12:00:00Z'), {
      allowedWeekdays: [...allowedWeekdays],
      restrictions: [],
    });

    expect(decision.reason).toBe('WEEKDAY_NOT_ALLOWED');
  });

  it('rejeita uma data bloqueada pelo calendário', () => {
    const decision = isAcademicDay(new Date('2027-03-01T12:00:00Z'), {
      allowedWeekdays: [...allowedWeekdays],
      restrictions: [
        {
          date: '2027-03-01',
          blocksAcademicActivities: true,
          reason: 'Feriado',
        },
      ],
    });

    expect(decision.reason).toBe('CALENDAR_BLOCKED');
  });
});
