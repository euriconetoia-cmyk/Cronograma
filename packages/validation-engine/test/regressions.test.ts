import { expect, it } from 'vitest';
import { validateResourceConflicts, validateSchedule } from '../src';

it('recusa professor sem janela no dia do encontro', () => {
  expect(
    validateResourceConflicts(
      [{ id: 'a', date: '2026-10-05', startTime: '19:00', endTime: '23:00', instructorId: 'p' }],
      [{ personId: 'p', weekday: 2, startTime: '19:00', endTime: '23:00' }],
    ),
  ).toEqual(
    expect.arrayContaining([expect.objectContaining({ code: 'INSTRUCTOR_OUTSIDE_AVAILABILITY' })]),
  );
});

it('identifica professor e turmas em todos os pares de conflito', () => {
  const meetings = ['a', 'b', 'c'].map((id) => ({
    id,
    date: '2026-10-05',
    startTime: '19:00',
    endTime: '23:00',
    instructorId: 'p',
    instructorName: 'Ana',
    classCode: id,
  }));
  const issues = validateResourceConflicts(meetings, []);
  expect(issues.filter((i) => i.code === 'INSTRUCTOR_CONFLICT')).toHaveLength(3);
  expect(issues.find((i) => i.code === 'INSTRUCTOR_CONFLICT')?.message).toContain('Ana');
  expect(issues.find((i) => i.code === 'INSTRUCTOR_CONFLICT')?.message).toContain('a');
});

it('valida carga do curso, encontros fora da UC e ano letivo incluindo AVA', () => {
  const issues = validateSchedule({
    courseTotalHours: 120,
    matrixTotalHours: 80,
    academicYear: 2026,
    items: [
      {
        title: 'UC',
        type: 'CURRICULAR_UNIT',
        totalHours: 80,
        startDate: '2026-12-01',
        endDate: '2026-12-10',
        avaEndDate: '2027-01-01',
        meetings: [{ date: '2026-12-15', startTime: '19:00', endTime: '23:00' }],
      },
    ],
  });
  expect(issues.map((i) => i.code)).toEqual(
    expect.arrayContaining([
      'COURSE_HOURS_MISMATCH',
      'MEETING_OUTSIDE_ITEM_PERIOD',
      'SCHEDULE_OUTSIDE_ACADEMIC_YEAR',
    ]),
  );
});
