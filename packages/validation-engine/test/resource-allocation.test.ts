import { describe, expect, it } from 'vitest';
import { validateResourceConflicts } from '../src';

describe('resource allocation completeness', () => {
  it('avisa quando encontro não possui instrutor e sala', () => {
    const issues = validateResourceConflicts(
      [{ id: 'a', date: '2027-03-01', startTime: '19:00', endTime: '22:00', title: 'UC 01' }],
      [],
    );

    expect(issues.some((issue) => issue.code === 'INSTRUCTOR_NOT_ASSIGNED')).toBe(true);
    expect(issues.some((issue) => issue.code === 'ROOM_NOT_ASSIGNED')).toBe(true);
  });

  it('gera erro quando a sala não comporta a turma', () => {
    const issues = validateResourceConflicts(
      [
        {
          id: 'a',
          date: '2027-03-01',
          startTime: '19:00',
          endTime: '22:00',
          roomId: 'r1',
          roomCapacity: 20,
          expectedStudents: 30,
        },
      ],
      [],
    );

    expect(issues.some((issue) => issue.code === 'ROOM_CAPACITY_INSUFFICIENT')).toBe(true);
  });
});
