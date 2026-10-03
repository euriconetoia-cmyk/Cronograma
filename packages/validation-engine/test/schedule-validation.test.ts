import { describe, expect, it } from 'vitest';
import { validateSchedule } from '../src';

describe('validateSchedule', () => {
  it('detecta item sobre data bloqueada', () => {
    const issues = validateSchedule({
      items: [
        {
          title: 'UC 01',
          type: 'CURRICULAR_UNIT',
          startDate: '2027-03-01',
          endDate: '2027-03-05',
          totalHours: 9,
        },
      ],
      restrictions: [
        {
          startDate: '2027-03-05',
          endDate: '2027-03-05',
          blocksAcademicActivities: true,
          reason: 'Feriado',
        },
      ],
    });

    expect(issues.some((item) => item.code === 'ITEM_ON_BLOCKED_DATE')).toBe(true);
  });

  it('detecta carga horária incompatível', () => {
    const issues = validateSchedule({
      items: [
        {
          title: 'UC 01',
          type: 'CURRICULAR_UNIT',
          startDate: '2027-03-01',
          endDate: '2027-03-05',
          totalHours: 8,
          expectedHours: 9,
        },
      ],
    });

    expect(issues.some((item) => item.code === 'UC_HOURS_MISMATCH')).toBe(true);
  });

  it('detecta quantidade insuficiente de encontros', () => {
    const issues = validateSchedule({
      items: [
        {
          title: 'UC 01',
          type: 'CURRICULAR_UNIT',
          startDate: '2027-03-01',
          endDate: '2027-03-05',
          totalHours: 9,
          requiredMeetingCount: 2,
          meetings: [],
        },
      ],
    });

    expect(issues.some((item) => item.code === 'REQUIRED_MEETINGS_MISSING')).toBe(true);
  });
});
