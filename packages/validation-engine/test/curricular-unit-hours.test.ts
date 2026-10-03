import { describe, expect, it } from 'vitest';
import { validateCurricularUnitHours } from '../src';

describe('validateCurricularUnitHours', () => {
  it('aceita distribuição compatível com a carga total', () => {
    expect(
      validateCurricularUnitHours({
        totalHours: 80,
        inPersonHours: 16,
        eadHours: 64,
      }),
    ).toEqual([]);
  });

  it('rejeita carga presencial mais EaD acima da carga total', () => {
    const issues = validateCurricularUnitHours({
      totalHours: 80,
      inPersonHours: 30,
      eadHours: 60,
    });

    expect(issues[0]?.code).toBe('UC_PRESENCE_HOURS_EXCEED_TOTAL');
  });

  it('rejeita carga síncrona mais assíncrona acima da carga total', () => {
    const issues = validateCurricularUnitHours({
      totalHours: 80,
      synchronousHours: 50,
      asynchronousHours: 40,
    });

    expect(issues[0]?.code).toBe('UC_SYNC_HOURS_EXCEED_TOTAL');
  });
});
