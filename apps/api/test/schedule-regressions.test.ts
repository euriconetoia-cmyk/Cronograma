import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SchedulesService } from '../src/schedules/schedules.service';

test('publicado não pode ser regerado nem produzir snapshot', async () => {
  let writes = 0;
  const service = new SchedulesService(
    { schedule: { findUnique: async () => ({ id: 's', status: 'PUBLISHED' }) } } as any,
    {
      createVersion: async () => {
        writes++;
      },
    } as any,
  );
  service.preview = async () => {
    throw new Error('preview não deveria ser chamado');
  };
  await assert.rejects(() => service.generateAndSave('t'), /publicado|Publicado/);
  assert.equal(writes, 0);
});

test('PATCH sem Fim AVA preserva a data existente', async () => {
  let saved: any;
  const existing = {
    id: 'i',
    scheduleId: 's',
    avaEndDate: new Date('2026-10-10T12:00:00Z'),
    meetings: [],
    schedule: { status: 'REVIEW', classGroup: { academicCalendar: { year: 2026 } } },
  };
  const tx = {
    $queryRaw: async () => [{ status: 'REVIEW' }],
    scheduleItem: {
      update: async (args: any) => {
        saved = args.data;
        return existing;
      },
    },
  };
  const service = new SchedulesService(
    {
      scheduleItem: { findUnique: async () => existing, update: tx.scheduleItem.update },
      $transaction: async (fn: any) => fn(tx),
    } as any,
    { createVersion: async () => {}, audit: async () => {} } as any,
  );
  await service.updateItem('i', {
    actorName: 'Teste',
    adjustmentReason: 'Ajuste',
    startDate: '2026-10-05',
    endDate: '2026-10-06',
  });
  assert.equal(saved.avaEndDate, undefined);
});

test('encurtar uma UC não deixa encontros fora do período', async () => {
  const service = new SchedulesService(
    {
      scheduleItem: {
        findUnique: async () => ({
          id: 'i',
          scheduleId: 's',
          avaEndDate: null,
          meetings: [{ date: new Date('2026-10-10T12:00:00Z') }],
          schedule: { status: 'REVIEW', classGroup: { academicCalendar: { year: 2026 } } },
        }),
        update: async () => ({}),
      },
    } as any,
    { createVersion: async () => {}, audit: async () => {} } as any,
  );
  await assert.rejects(
    () =>
      service.updateItem('i', {
        actorName: 'Teste',
        adjustmentReason: 'Ajuste',
        startDate: '2026-10-05',
        endDate: '2026-10-06',
      }),
    /encontro/,
  );
});

test('a turma consulta encontros externos e identifica ambas as turmas', async () => {
  const own = {
    id: 'a',
    date: new Date('2026-10-05T12:00:00Z'),
    startTime: '19:00',
    endTime: '23:00',
    instructorId: 'p',
    instructor: { name: 'Ana' },
    roomId: 'r',
    room: { name: 'Lab', capacity: 30 },
  };
  const external = {
    ...own,
    id: 'b',
    scheduleItem: { title: 'Outra UC', schedule: { classGroup: { code: 'T2' } } },
  };
  let queried = false;
  const service = new SchedulesService(
    {
      schedule: {
        findUnique: async () => ({
          id: 's',
          classGroup: { code: 'T1', expectedStudents: 20 },
          items: [{ title: 'UC', meetings: [own] }],
        }),
      },
      meeting: {
        findMany: async () => {
          queried = true;
          return [external];
        },
      },
      personAvailability: {
        findMany: async () => [
          { personId: 'p', weekday: 'MONDAY', startTime: '19:00', endTime: '23:00' },
        ],
      },
    } as any,
    {} as any,
  );
  const issues = await service.resourceConflicts('t');
  assert.equal(queried, true);
  const conflict = issues.find((i) => i.code === 'INSTRUCTOR_CONFLICT');
  assert.match(conflict?.message ?? '', /Ana.*T1.*T2/);
});

test('PATCH rejeita data impossível antes da gravação', async () => {
  let writes = 0;
  const item = {
    id: 'i',
    scheduleId: 's',
    avaEndDate: null,
    meetings: [],
    schedule: { status: 'REVIEW', classGroup: { academicCalendar: { year: 2026 } } },
  };
  const tx = {
    $queryRaw: async () => [{ status: 'REVIEW' }],
    scheduleItem: {
      update: async () => {
        writes++;
        return item;
      },
    },
  };
  const s = new SchedulesService(
    {
      scheduleItem: { findUnique: async () => item },
      $transaction: async (fn: any) => fn(tx),
    } as any,
    { createVersion: async () => {}, audit: async () => {} } as any,
  );
  await assert.rejects(
    () =>
      s.updateItem('i', {
        actorName: 'Teste',
        adjustmentReason: 'Ajuste',
        startDate: '2026-02-30',
        endDate: '2026-02-30',
      }),
    /[Dd]ata/,
  );
  assert.equal(writes, 0);
});
