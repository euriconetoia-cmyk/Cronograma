import { describe, expect, it } from 'vitest';
import { validateResourceConflicts } from '../src';

describe('validateResourceConflicts', () => {
  it('detecta instrutor em dois encontros simultaneos', () => {
    const issues = validateResourceConflicts(
      [
        { id: 'a', date: '2027-03-01', startTime: '19:00', endTime: '22:00', instructorId: 'p1' },
        { id: 'b', date: '2027-03-01', startTime: '20:00', endTime: '21:00', instructorId: 'p1' },
      ],
      [],
    );

    expect(issues.some((issue) => issue.code === 'INSTRUCTOR_CONFLICT')).toBe(true);
  });

  it('detecta sala ocupada no mesmo horario', () => {
    const issues = validateResourceConflicts(
      [
        { id: 'a', date: '2027-03-01', startTime: '19:00', endTime: '22:00', roomId: 'r1' },
        { id: 'b', date: '2027-03-01', startTime: '21:00', endTime: '22:30', roomId: 'r1' },
      ],
      [],
    );

    expect(issues.some((issue) => issue.code === 'ROOM_CONFLICT')).toBe(true);
  });

  it('detecta instrutor fora da disponibilidade', () => {
    const issues = validateResourceConflicts(
      [
        { id: 'a', date: '2027-03-01', startTime: '19:00', endTime: '22:00', instructorId: 'p1' },
      ],
      [
        { personId: 'p1', weekday: 1, startTime: '08:00', endTime: '12:00' },
      ],
    );

    expect(
      issues.some((issue) => issue.code === 'INSTRUCTOR_OUTSIDE_AVAILABILITY'),
    ).toBe(true);
  });
});
