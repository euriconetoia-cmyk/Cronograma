import { describe, expect, it } from 'vitest';
import { generateSchedule } from '../src';

const baseInput = {
  startDate: '2027-03-01',
  scheduleRules: [
    { weekday: 1 as const, startTime: '19:00', endTime: '22:00' },
    { weekday: 3 as const, startTime: '19:00', endTime: '22:00' },
    { weekday: 5 as const, startTime: '19:00', endTime: '22:00' },
  ],
  restrictions: [],
  classRules: {
    generateRecovery: false,
    avaExtraDays: 0,
    allowNextUcDuringRecovery: false,
  },
  modules: [
    {
      id: 'm1',
      name: 'Módulo 1',
      order: 1,
      curricularUnits: [
        {
          id: 'uc1',
          name: 'UC 01',
          order: 1,
          totalHours: 9,
          meetingCount: 2,
          meetingHours: 3,
          requiresInPerson: true,
          requiresWebClass: false,
          recoveryEnabled: false,
          avaExtraDays: 2,
        },
      ],
    },
  ],
};

describe('generateSchedule', () => {
  it('não usa calendário de um ano para gerar encontros em outro ano', () => {
    expect(() =>
      generateSchedule({ ...baseInput, academicYear: 2026, startDate: '2026-12-31' }),
    ).toThrow(/ano letivo/);
  });
  it('distribui a UC conforme os dias e horários permitidos', () => {
    const result = generateSchedule(baseInput);

    expect(result.items[0]).toMatchObject({
      title: 'UC 01',
      startDate: '2027-03-01',
      endDate: '2027-03-05',
      avaEndDate: '2027-03-07',
      totalHours: 9,
    });
    expect(result.items[0]?.meetings).toHaveLength(2);
  });

  it('ignora uma data bloqueada pelo calendário', () => {
    const result = generateSchedule({
      ...baseInput,
      restrictions: [
        {
          startDate: '2027-03-03',
          endDate: '2027-03-03',
          blocksAcademicActivities: true,
          reason: 'Feriado',
        },
      ],
    });

    expect(result.items[0]?.endDate).toBe('2027-03-08');
  });

  it('gera recuperação quando habilitada na turma e na UC', () => {
    const result = generateSchedule({
      ...baseInput,
      classRules: {
        ...baseInput.classRules,
        generateRecovery: true,
      },
      modules: [
        {
          ...baseInput.modules[0]!,
          curricularUnits: [
            {
              ...baseInput.modules[0]!.curricularUnits[0]!,
              recoveryEnabled: true,
            },
          ],
        },
      ],
    });

    expect(result.items[1]?.type).toBe('RECOVERY');
    expect(result.warnings[0]).toContain('duração padrão de 1 dia acadêmico');
  });

  it('gera alerta quando ultrapassa a data limite', () => {
    const result = generateSchedule({
      ...baseInput,
      endDateLimit: '2027-03-03',
    });

    expect(result.warnings.some((warning) => warning.includes('data limite'))).toBe(true);
  });
});
