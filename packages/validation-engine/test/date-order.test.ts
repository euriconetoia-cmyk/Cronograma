import { describe, expect, it } from 'vitest';
import { validateDateOrder } from '../src';

describe('validateDateOrder', () => {
  it('retorna erro quando o término é anterior ao início', () => {
    const result = validateDateOrder(
      new Date('2027-03-10T12:00:00Z'),
      new Date('2027-03-09T12:00:00Z'),
    );

    expect(result[0]?.code).toBe('END_BEFORE_START');
  });

  it('não retorna erro para intervalo válido', () => {
    const result = validateDateOrder(
      new Date('2027-03-10T12:00:00Z'),
      new Date('2027-03-11T12:00:00Z'),
    );

    expect(result).toEqual([]);
  });
});
