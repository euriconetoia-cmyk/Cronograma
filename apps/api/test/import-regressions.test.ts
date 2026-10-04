import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { ImportExportService } from '../src/import-export/import-export.service';

const date = (s: string) => new Date(`${s}T12:00:00Z`);
const exportedSchedule = {
  classGroup: { code: 'T1', course: { name: 'Curso' }, courseVersion: { name: 'M1' } },
  items: [
    {
      title: 'UC',
      type: 'CURRICULAR_UNIT',
      totalHours: 4,
      startDate: date('2026-10-05'),
      endDate: date('2026-10-05'),
      avaEndDate: null,
      meetings: [
        {
          number: 1,
          type: 'WEB_CLASS',
          hours: 2,
          date: date('2026-10-05'),
          startTime: '19:00',
          endTime: '23:00',
          instructor: { name: 'Ana' },
          room: { name: 'Lab' },
        },
      ],
    },
    {
      title: 'Recuperação - UC',
      type: 'RECOVERY',
      totalHours: 0,
      startDate: date('2026-10-06'),
      endDate: date('2026-10-06'),
      avaEndDate: null,
      meetings: [],
    },
  ],
};
const service = new ImportExportService(
  { schedule: { findUnique: async () => exportedSchedule } } as any,
  {} as any,
);

test('reimporta a própria exportação com encontros web e recuperação', async () => {
  const preview = await service.previewImport(
    'export.xlsx',
    await service.exportScheduleExcel('t'),
  );
  assert.equal(preview.invalidRows, 0);
  assert.equal(preview.rows[0]?.normalized.meetingNumber, 1);
  assert.equal(preview.rows[0]?.normalized.meetingStartTime, '19:00');
  assert.equal(preview.rows[0]?.normalized.meetingType, 'WEB_CLASS');
  assert.equal(preview.rows[0]?.normalized.instructor, 'Ana');
  assert.equal(preview.rows[0]?.normalized.meetingHours, 2);
  assert.equal(preview.rows[1]?.normalized.itemType, 'RECOVERY');
});

test('omitir uma recuperação existente não pode apagá-la', async () => {
  let writes = 0;
  const s = new ImportExportService(
    {
      classGroup: {
        findUnique: async () => ({
          id: 't',
          unitId: 'u',
          course: { totalHours: 4 },
          academicCalendar: { year: 2026, events: [] },
          courseVersion: {
            modules: [
              { curricularUnits: [{ id: 'uc', name: 'UC', totalHours: 4, meetingCount: 0 }] },
            ],
          },
          schedule: {
            id: 's',
            status: 'REVIEW',
            items: [{ type: 'RECOVERY', title: 'Recuperação - UC', meetings: [] }],
          },
        }),
      },
      person: { findMany: async () => [] },
      room: { findMany: async () => [] },
      $transaction: async () => {
        writes++;
        return { id: 's' };
      },
    } as any,
    {
      createVersion: async () => {
        writes++;
      },
      audit: async () => {
        writes++;
      },
    } as any,
  );
  await assert.rejects(
    () =>
      s.applyScheduleImport({
        classGroupId: 't',
        actorName: 'Teste',
        rows: [
          {
            curricularUnit: 'UC',
            startDate: '2026-10-05',
            endDate: '2026-10-05',
          },
        ],
      }),
    /ausente|incompleta/,
  );
  assert.equal(writes, 0);
});

test('mantém índices de colunas vazias', async () => {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet('Teste');
  sheet.addRow(['UC', '', 'CH', 'Início', 'Término', 'Encontro', 'Data encontro', 'Horário']);
  sheet.addRow(['UC', '', 4, '2026-10-05', '2026-10-05', 1, '2026-10-05', '19:00 - 23:00']);
  const p = await service.previewImport('test.xlsx', Buffer.from(await book.xlsx.writeBuffer()));
  assert.equal(p.invalidRows, 0);
  assert.equal(p.rows[0]?.normalized.totalHours, 4);
  assert.equal(p.rows[0]?.normalized.startDate, '2026-10-05');
});

test('datas impossíveis e encontros incompletos são inválidos na prévia', async () => {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet('Teste');
  sheet.addRow(['UC', 'CH', 'Início', 'Término', 'Encontro', 'Data encontro']);
  sheet.addRow(['UC', 4, '2026-02-30', '2026-03-01', 1, '2026-03-01']);
  const p = await service.previewImport('test.xlsx', Buffer.from(await book.xlsx.writeBuffer()));
  assert.equal(p.invalidRows, 1);
  assert.ok(p.rows[0]!.errors.length >= 2);
});

test('encontro incompleto é rejeitado antes de qualquer snapshot ou escrita', async () => {
  let writes = 0;
  const s = new ImportExportService(
    {
      classGroup: {
        findUnique: async () => ({
          courseVersion: {
            modules: [
              {
                curricularUnits: [
                  { id: 'u', name: 'UC', totalHours: 4, order: 1, meetingCount: 1 },
                ],
              },
            ],
          },
          schedule: { id: 's', status: 'REVIEW' },
        }),
      },
      $transaction: async () => {
        writes++;
        return { id: 's' };
      },
    } as any,
    {
      createVersion: async () => {
        writes++;
      },
      audit: async () => {
        writes++;
      },
    } as any,
  );
  await assert.rejects(
    () =>
      s.applyScheduleImport({
        classGroupId: 't',
        actorName: 'Teste',
        rows: [
          {
            curricularUnit: 'UC',
            startDate: '2026-10-05',
            endDate: '2026-10-05',
            meetingNumber: 1,
            meetingDate: '2026-10-05',
          },
        ],
      }),
    /[Ee]ncontro|horário/,
  );
  assert.equal(writes, 0);
});
