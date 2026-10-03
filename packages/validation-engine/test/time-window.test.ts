import { describe, expect, it } from 'vitest';
import { validateTimeWindow } from '../src';

describe('validateTimeWindow', () => {
  it('aceita janela de horário válida', () => {
    expect(validateTimeWindow('19:00', '22:00')).toEqual([]);
  });

  it('rejeita término igual ao início', () => {
    expect(validateTimeWindow('19:00', '19:00')[0]?.code).toBe('END_TIME_NOT_AFTER_START');
  });

  it('rejeita término anterior ao início', () => {
    expect(validateTimeWindow('22:00', '19:00')[0]?.code).toBe('END_TIME_NOT_AFTER_START');
  });
});
