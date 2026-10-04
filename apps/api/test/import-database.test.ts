import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@cronograma/database';
import { ImportExportService } from '../src/import-export/import-export.service';
import { SchedulesService } from '../src/schedules/schedules.service';
import { VersioningService } from '../src/schedules/versioning.service';
import { WorkflowService } from '../src/schedules/workflow.service';
import type { ImportScheduleRowDto } from '../src/import-export/dto/apply-schedule-import.dto';

// All fixtures and service writes run inside a transaction that always rolls back.
test(
  'PostgreSQL: gerar, exportar e reimportar preserva encontros, recursos e recuperação',
  { skip: process.env.RUN_DATABASE_TESTS !== '1' },
  async () => {
    const client = new PrismaClient();
    const rollback = new Error('TEST_ROLLBACK');
    try {
      await client.$transaction(
        async (tx) => {
          const unique = randomUUID();
          const unit = await tx.unit.create({
            data: { code: unique, name: unique, city: 'Teste', state: 'SP' },
          });
          const modality = await tx.modality.create({
            data: { code: unique, name: unique, allowsWebClasses: true },
          });
          const course = await tx.course.create({
            data: { code: unique, name: 'Curso teste', totalHours: 4 },
          });
          const matrix = await tx.courseVersion.create({
            data: { courseId: course.id, name: 'Matriz teste' },
          });
          const module = await tx.courseModule.create({
            data: { courseVersionId: matrix.id, name: 'Módulo', order: 1 },
          });
          await tx.curricularUnit.create({
            data: {
              moduleId: module.id,
              name: 'UC teste',
              order: 1,
              totalHours: 4,
              meetingCount: 1,
              meetingHours: 2,
              requiresWebClass: true,
              recoveryEnabled: true,
            },
          });
          const calendar = await tx.academicCalendar.create({
            data: { unitId: unit.id, name: 'Calendário', year: 2026 },
          });
          const group = await tx.classGroup.create({
            data: {
              code: unique,
              courseId: course.id,
              courseVersionId: matrix.id,
              unitId: unit.id,
              modalityId: modality.id,
              academicCalendarId: calendar.id,
              startDate: new Date('2026-10-05T12:00:00Z'),
              generateRecovery: true,
              scheduleRules: {
                create: [
                  { weekday: 'MONDAY', startTime: '19:00', endTime: '23:00' },
                  { weekday: 'TUESDAY', startTime: '19:00', endTime: '23:00' },
                ],
              },
            },
          });
          const person = await tx.person.create({ data: { name: unique } });
          await tx.personAvailability.create({
            data: { personId: person.id, weekday: 'MONDAY', startTime: '19:00', endTime: '23:00' },
          });
          const room = await tx.room.create({
            data: { unitId: unit.id, name: unique, code: unique, type: 'CLASSROOM' },
          });
          const database = new Proxy(tx, {
            get(target, key) {
              if (key === '$transaction') return (fn: (value: typeof tx) => unknown) => fn(tx);
              return Reflect.get(target, key);
            },
          }) as any;
          const versions = new VersioningService(database);
          const schedules = new SchedulesService(database, versions);
          const generated = await schedules.generateAndSave(group.id, 'Teste');
          const originalMeeting = generated.items.flatMap((item) => item.meetings)[0]!;
          await tx.meeting.update({
            where: { id: originalMeeting.id },
            data: { instructorId: person.id, roomId: room.id },
          });
          const imports = new ImportExportService(database, versions);
          const preview = await imports.previewImport(
            'export.xlsx',
            await imports.exportScheduleExcel(group.id),
          );
          assert.equal(preview.invalidRows, 0);
          const rows = preview.rows.map(
            (row) =>
              Object.fromEntries(
                Object.entries(row.normalized).filter(
                  ([key, value]) =>
                    value != null &&
                    [
                      'curricularUnit',
                      'curricularUnitId',
                      'itemType',
                      'itemOrder',
                      'totalHours',
                      'startDate',
                      'endDate',
                      'avaEndDate',
                      'meetingNumber',
                      'meetingDate',
                      'meetingStartTime',
                      'meetingEndTime',
                      'meetingType',
                      'meetingHours',
                      'instructor',
                      'room',
                    ].includes(key),
                ),
              ) as unknown as ImportScheduleRowDto,
          );
          const imported = await imports.applyScheduleImport({
            classGroupId: group.id,
            actorName: 'Teste',
            rows,
          });
          assert.equal(imported.schedule.items.length, 2);
          assert.equal(imported.schedule.items[1]?.type, 'RECOVERY');
          const meetings = imported.schedule.items.flatMap((item) => item.meetings);
          assert.equal(meetings.length, 1);
          assert.equal(meetings[0]?.type, 'WEB_CLASS');
          assert.equal(meetings[0]?.hours, 2);
          assert.equal(meetings[0]?.instructorId, person.id);
          assert.equal(meetings[0]?.roomId, room.id);
          const workflow = new WorkflowService(database, versions, schedules);
          await workflow.requestApproval(group.id, 'Teste');
          await workflow.approve(group.id, 'Teste');
          const published = await workflow.publish(group.id, 'Teste');
          assert.equal(published.status, 'PUBLISHED');
          await assert.rejects(() => schedules.generateAndSave(group.id), /publicado/);
          await assert.rejects(
            () => imports.applyScheduleImport({ classGroupId: group.id, actorName: 'Teste', rows }),
            /publicado/,
          );
          throw rollback;
        },
        { timeout: 15000 },
      );
    } catch (error) {
      if (error !== rollback) throw error;
    } finally {
      await client.$disconnect();
    }
  },
);
