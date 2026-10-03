import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { MeetingType, ScheduleItemType } from '@cronograma/database';
import { DatabaseService } from '../database/database.service';
import { VersioningService } from '../schedules/versioning.service';
import { ApplyScheduleImportDto } from './dto/apply-schedule-import.dto';
import type {
  ImportColumnMapping,
  ImportPreview,
  ImportPreviewRow,
  ImportTemplateType,
} from './import-export.types';

@Injectable()
export class ImportExportService {
  constructor(
    private readonly database: DatabaseService,
    private readonly versioning: VersioningService,
  ) {}

  async exportScheduleExcel(classGroupId: string) {
    const schedule = await this.loadSchedule(classGroupId);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Cronograma');

    sheet.columns = [
      { header: 'Turma', key: 'classCode', width: 18 },
      { header: 'Curso', key: 'course', width: 36 },
      { header: 'Matriz', key: 'matrix', width: 16 },
      { header: 'Item', key: 'title', width: 38 },
      { header: 'Tipo', key: 'type', width: 18 },
      { header: 'CH', key: 'hours', width: 10 },
      { header: 'Início', key: 'startDate', width: 14 },
      { header: 'Término', key: 'endDate', width: 14 },
      { header: 'Fim AVA', key: 'avaEndDate', width: 14 },
      { header: 'Encontro', key: 'meetingNumber', width: 12 },
      { header: 'Data encontro', key: 'meetingDate', width: 16 },
      { header: 'Horário', key: 'meetingTime', width: 18 },
      { header: 'Instrutor', key: 'instructor', width: 28 },
      { header: 'Sala/Lab', key: 'room', width: 24 },
    ];

    for (const item of schedule.items) {
      if (item.meetings.length === 0) {
        sheet.addRow({
          classCode: schedule.classGroup.code,
          course: schedule.classGroup.course.name,
          matrix: schedule.classGroup.courseVersion.name,
          title: item.title,
          type: item.type,
          hours: item.totalHours,
          startDate: this.toDate(item.startDate),
          endDate: this.toDate(item.endDate),
          avaEndDate: item.avaEndDate ? this.toDate(item.avaEndDate) : '',
        });
        continue;
      }

      for (const meeting of item.meetings) {
        sheet.addRow({
          classCode: schedule.classGroup.code,
          course: schedule.classGroup.course.name,
          matrix: schedule.classGroup.courseVersion.name,
          title: item.title,
          type: item.type,
          hours: item.totalHours,
          startDate: this.toDate(item.startDate),
          endDate: this.toDate(item.endDate),
          avaEndDate: item.avaEndDate ? this.toDate(item.avaEndDate) : '',
          meetingNumber: meeting.number,
          meetingDate: this.toDate(meeting.date),
          meetingTime: `${meeting.startTime} - ${meeting.endTime}`,
          instructor: meeting.instructor?.name ?? '',
          room: meeting.room?.name ?? '',
        });
      }
    }

    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async exportScheduleCsv(classGroupId: string) {
    const schedule = await this.loadSchedule(classGroupId);
    const headers = [
      'Turma','Curso','Matriz','Item','Tipo','CH','Inicio','Termino',
      'Fim AVA','Encontro','Data encontro','Horario','Instrutor','Sala/Lab',
    ];

    const rows: string[][] = [];

    for (const item of schedule.items) {
      const meetings = item.meetings.length > 0 ? item.meetings : [null];

      for (const meeting of meetings) {
        rows.push([
          schedule.classGroup.code,
          schedule.classGroup.course.name,
          schedule.classGroup.courseVersion.name,
          item.title,
          item.type,
          String(item.totalHours),
          this.toDate(item.startDate),
          this.toDate(item.endDate),
          item.avaEndDate ? this.toDate(item.avaEndDate) : '',
          meeting ? String(meeting.number) : '',
          meeting ? this.toDate(meeting.date) : '',
          meeting ? `${meeting.startTime} - ${meeting.endTime}` : '',
          meeting?.instructor?.name ?? '',
          meeting?.room?.name ?? '',
        ]);
      }
    }

    const escape = (value: string) => {
      const escaped = value.replace(/"/g, '""');
      return /[",\n;]/.test(value) ? `"${escaped}"` : escaped;
    };

    return [headers, ...rows].map((row) => row.map(escape).join(';')).join('\n');
  }

  async previewImport(fileName: string, buffer: Buffer): Promise<ImportPreview> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.worksheets[0];
    if (!sheet) {
      throw new BadRequestException('A planilha não possui abas legíveis.');
    }

    const headerRow = this.findHeaderRow(sheet);
    if (!headerRow) {
      throw new BadRequestException('Não foi possível identificar o cabeçalho da planilha.');
    }

    const headers = headerRow.values
      .slice(1)
      .map((value) => String(value ?? '').trim())
      .filter(Boolean);

    const template = this.detectTemplate(headers);
    const mapping = this.detectMapping(headers);
    const rows: ImportPreviewRow[] = [];

    for (let rowNumber = headerRow.number + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
      const row = sheet.getRow(rowNumber);
      const raw: Record<string, unknown> = {};

      headers.forEach((header, index) => {
        raw[header] = row.getCell(index + 1).value ?? null;
      });

      if (Object.values(raw).every((value) => value === null || value === '')) continue;

      const normalized = this.normalizeRow(raw, mapping);
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!normalized.curricularUnit) errors.push('Unidade Curricular não identificada.');
      if (!normalized.startDate) errors.push('Data de início não identificada.');
      if (!normalized.endDate) errors.push('Data de término não identificada.');
      if (!normalized.totalHours) warnings.push('Carga horária não identificada.');
      if (!normalized.course) warnings.push('Curso não identificado.');

      rows.push({
        rowNumber,
        raw,
        normalized,
        errors,
        warnings,
      });
    }

    return {
      fileName,
      template,
      sheetName: sheet.name,
      headers,
      mapping,
      totalRows: rows.length,
      validRows: rows.filter((row) => row.errors.length === 0).length,
      invalidRows: rows.filter((row) => row.errors.length > 0).length,
      rows: rows.slice(0, 200),
    };
  }

  async applyScheduleImport(data: ApplyScheduleImportDto) {
    if (data.rows.length === 0) {
      throw new BadRequestException('Nenhuma linha válida foi enviada para importação.');
    }

    const classGroup = await this.database.classGroup.findUnique({
      where: { id: data.classGroupId },
      include: {
        courseVersion: {
          include: {
            modules: {
              include: {
                curricularUnits: true,
              },
            },
          },
        },
        schedule: true,
      },
    });

    if (!classGroup) {
      throw new NotFoundException('Turma não encontrada.');
    }

    const units = classGroup.courseVersion.modules.flatMap((module) => module.curricularUnits);
    const unitByName = new Map(
      units.map((unit) => [this.normalizeHeader(unit.name), unit]),
    );

    const grouped = new Map<string, typeof data.rows>();
    const unmatched: string[] = [];

    for (const row of data.rows) {
      const unit = unitByName.get(this.normalizeHeader(row.curricularUnit));
      if (!unit) {
        unmatched.push(row.curricularUnit);
        continue;
      }

      const list = grouped.get(unit.id) ?? [];
      list.push(row);
      grouped.set(unit.id, list);
    }

    if (unmatched.length > 0) {
      throw new BadRequestException(
        `Existem UCs sem correspondência na matriz: ${[...new Set(unmatched)].join(', ')}.`,
      );
    }

    if (classGroup.schedule) {
      await this.versioning.createVersion(
        classGroup.schedule.id,
        data.actorName,
        'Snapshot anterior à importação de planilha',
      );
    }

    const orderedGroups = [...grouped.entries()]
      .map(([unitId, rows]) => ({
        unit: units.find((unit) => unit.id === unitId)!,
        rows,
      }))
      .sort((a, b) => a.unit.order - b.unit.order);

    const schedule = await this.database.$transaction(async (tx) => {
      let scheduleId = classGroup.schedule?.id;

      if (scheduleId) {
        await tx.scheduleItem.deleteMany({
          where: { scheduleId },
        });
      } else {
        const created = await tx.schedule.create({
          data: {
            classGroupId: classGroup.id,
          },
        });
        scheduleId = created.id;
      }

      let order = 1;
      const importedItems = [];

      for (const group of orderedGroups) {
        const first = group.rows[0]!;
        const last = group.rows[group.rows.length - 1]!;
        const startDate = this.parseDateInput(first.startDate);
        const endDate = this.parseDateInput(last.endDate || first.endDate);
        const avaEndDate = first.avaEndDate
          ? this.parseDateInput(first.avaEndDate)
          : null;

        const meetings = group.rows
          .filter(
            (row) =>
              row.meetingNumber &&
              row.meetingDate &&
              row.meetingStartTime &&
              row.meetingEndTime,
          )
          .map((row) => ({
            number: row.meetingNumber!,
            type: MeetingType.PRESENTIAL,
            date: this.parseDateInput(row.meetingDate!),
            startTime: row.meetingStartTime!,
            endTime: row.meetingEndTime!,
            hours: this.calculateHours(row.meetingStartTime!, row.meetingEndTime!),
          }));

        importedItems.push({
          scheduleId,
          curricularUnitId: group.unit.id,
          type: ScheduleItemType.CURRICULAR_UNIT,
          title: group.unit.name,
          order,
          startDate,
          endDate,
          avaEndDate,
          totalHours: first.totalHours ?? group.unit.totalHours,
          manuallyAdjusted: true,
          adjustmentReason: 'Importado de planilha',
          meetings: {
            create: meetings,
          },
        });

        order += 1;
      }

      await tx.scheduleItem.createMany({
        data: importedItems.map(({ meetings: _meetings, ...item }) => item),
      });

      for (const item of importedItems) {
        if (item.meetings.create.length === 0) continue;

        const createdItem = await tx.scheduleItem.findFirst({
          where: {
            scheduleId,
            curricularUnitId: item.curricularUnitId,
            order: item.order,
          },
        });

        if (createdItem) {
          await tx.meeting.createMany({
            data: item.meetings.create.map((meeting) => ({
              scheduleItemId: createdItem.id,
              ...meeting,
            })),
          });
        }
      }

      const dates = importedItems.flatMap((item) => [item.startDate, item.endDate]);
      const startDate = new Date(Math.min(...dates.map((date) => date.getTime())));
      const endDate = new Date(Math.max(...dates.map((date) => date.getTime())));

      return tx.schedule.update({
        where: { id: scheduleId },
        data: {
          status: 'REVIEW',
          generatedAt: new Date(),
          startDate,
          endDate,
        },
        include: {
          items: {
            include: {
              meetings: true,
            },
            orderBy: { order: 'asc' },
          },
        },
      });
    });

    await this.versioning.createVersion(
      schedule.id,
      data.actorName,
      'Cronograma importado de planilha',
    );
    await this.versioning.audit(
      'Schedule',
      schedule.id,
      'IMPORT_EXCEL',
      data.actorName,
      'Importação confirmada pelo usuário',
      {
        importedRows: data.rows.length,
        importedUnits: grouped.size,
      },
    );

    return {
      schedule,
      importedRows: data.rows.length,
      importedUnits: grouped.size,
    };
  }

  private detectTemplate(headers: string[]): ImportTemplateType {
    const normalized = headers.map((header) => this.normalizeHeader(header));

    const hasWebClass = normalized.some((item) => item.includes('webaula'));
    const hasStudyDays = normalized.some((item) => item.includes('dias de estudo'));
    const hasEncounter = normalized.some((item) => item.includes('encontro'));
    const hasRecovery = normalized.some((item) => item.includes('recuperacao'));

    if (hasWebClass && hasRecovery) return 'QUALIFICATION';
    if (hasStudyDays && hasEncounter) return 'TECHNICAL';
    if (hasEncounter) return 'DAILY_DISTRIBUTION';
    return 'UNKNOWN';
  }

  private detectMapping(headers: string[]): ImportColumnMapping {
    const mapping: ImportColumnMapping = {};

    for (const header of headers) {
      const key = this.normalizeHeader(header);

      if (!mapping.course && key.includes('curso')) mapping.course = header;
      else if (!mapping.module && key.includes('modulo')) mapping.module = header;
      else if (
        !mapping.curricularUnit &&
        (key === 'uc' ||
          key.includes('unidade curricular') ||
          key.includes('componente curricular'))
      ) mapping.curricularUnit = header;
      else if (
        !mapping.meetingNumber &&
        key.includes('encontro') &&
        (key.includes('numero') || key.includes('n '))
      ) mapping.meetingNumber = header;
      else if (
        !mapping.meetingDate &&
        key.includes('data') &&
        (key.includes('encontro') || key.includes('presencial') || key.includes('webaula'))
      ) mapping.meetingDate = header;
      else if (
        !mapping.meetingStartTime &&
        (key.includes('hora') || key.includes('horario')) &&
        key.includes('inicio')
      ) mapping.meetingStartTime = header;
      else if (
        !mapping.meetingEndTime &&
        (key.includes('hora') || key.includes('horario')) &&
        (key.includes('fim') || key.includes('termino'))
      ) mapping.meetingEndTime = header;
      else if (
        !mapping.totalHours &&
        (key === 'ch' ||
          key.includes('ch total') ||
          key.includes('carga horaria total') ||
          key.includes('carga horaria'))
      ) mapping.totalHours = header;
      else if (
        !mapping.inPersonHours &&
        (key.includes('ch presencial') || key.includes('carga presencial'))
      ) mapping.inPersonHours = header;
      else if (
        !mapping.eadHours &&
        (key.includes('ch ead') || key.includes('carga ead'))
      ) mapping.eadHours = header;
      else if (
        !mapping.avaEndDate &&
        key.includes('ava') &&
        (key.includes('fim') || key.includes('termino'))
      ) mapping.avaEndDate = header;
      else if (
        !mapping.startDate &&
        (key.includes('data inicio') ||
          key.includes('inicio uc') ||
          key === 'inicio')
      ) mapping.startDate = header;
      else if (
        !mapping.endDate &&
        (key.includes('data termino') ||
          key.includes('data fim') ||
          key.includes('termino uc') ||
          key === 'termino' ||
          key === 'fim')
      ) mapping.endDate = header;
      else if (
        !mapping.classCode &&
        (key.includes('codigo evento') ||
          key.includes('evento') ||
          key.includes('codigo turma') ||
          key === 'turma')
      ) mapping.classCode = header;
      else if (!mapping.tutor && key.includes('tutor')) mapping.tutor = header;
      else if (!mapping.monitor && key.includes('monitor')) mapping.monitor = header;
      else if (!mapping.recovery && key.includes('recuperacao')) mapping.recovery = header;
    }

    return mapping;
  }

  private normalizeRow(raw: Record<string, unknown>, mapping: ImportColumnMapping) {
    const get = (field?: string) => (field ? raw[field] ?? null : null);

    return {
      course: this.asText(get(mapping.course)),
      module: this.asText(get(mapping.module)),
      curricularUnit: this.asText(get(mapping.curricularUnit)),
      totalHours: this.asNumber(get(mapping.totalHours)),
      inPersonHours: this.asNumber(get(mapping.inPersonHours)),
      eadHours: this.asNumber(get(mapping.eadHours)),
      startDate: this.asIsoDate(get(mapping.startDate)),
      endDate: this.asIsoDate(get(mapping.endDate)),
      avaEndDate: this.asIsoDate(get(mapping.avaEndDate)),
      classCode: this.asText(get(mapping.classCode)),
      tutor: this.asText(get(mapping.tutor)),
      monitor: this.asText(get(mapping.monitor)),
      meetingNumber: this.asNumber(get(mapping.meetingNumber)),
      meetingDate: this.asIsoDate(get(mapping.meetingDate)),
      meetingStartTime: this.asTime(get(mapping.meetingStartTime)),
      meetingEndTime: this.asTime(get(mapping.meetingEndTime)),
      recovery: this.asText(get(mapping.recovery)),
    };
  }

  private asText(value: unknown) {
    if (value === null || value === undefined || value === '') return null;
    return String(value).trim();
  }

  private asNumber(value: unknown) {
    if (typeof value === 'number') return value;
    if (value === null || value === undefined || value === '') return null;
    const normalized = Number(String(value).replace(',', '.'));
    return Number.isFinite(normalized) ? normalized : null;
  }

  private asIsoDate(value: unknown) {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    const text = String(value).trim();
    const br = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (br) return `${br[3]}-${br[2]}-${br[1]}`;
    const iso = text.match(/^\d{4}-\d{2}-\d{2}/);
    return iso ? iso[0] : text;
  }

  private asTime(value: unknown) {
    if (!value) return null;
    if (value instanceof Date) {
      return `${String(value.getUTCHours()).padStart(2, '0')}:${String(value.getUTCMinutes()).padStart(2, '0')}`;
    }
    const text = String(value).trim();
    const match = text.match(/(\d{1,2}):(\d{2})/);
    return match ? `${String(Number(match[1])).padStart(2, '0')}:${match[2]}` : text;
  }

  private parseDateInput(value: string) {
    const iso = this.asIsoDate(value);
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      throw new BadRequestException(`Data inválida na importação: ${value}`);
    }
    return new Date(`${iso}T12:00:00.000Z`);
  }

  private calculateHours(startTime: string, endTime: string) {
    const [startH = 0, startM = 0] = startTime.split(':').map(Number);
    const [endH = 0, endM = 0] = endTime.split(':').map(Number);
    return Math.max(1, Math.round(((endH * 60 + endM) - (startH * 60 + startM)) / 60));
  }

  private findHeaderRow(sheet: ExcelJS.Worksheet) {
    for (let i = 1; i <= Math.min(sheet.rowCount, 20); i += 1) {
      const row = sheet.getRow(i);
      const values = row.values
        .slice(1)
        .map((value) => String(value ?? '').trim())
        .filter(Boolean);

      if (values.length >= 4) return row;
    }

    return null;
  }

  private normalizeHeader(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  private toDate(value: Date) {
    return value.toISOString().slice(0, 10);
  }

  private async loadSchedule(classGroupId: string) {
    const schedule = await this.database.schedule.findUnique({
      where: { classGroupId },
      include: {
        classGroup: {
          include: {
            course: true,
            courseVersion: true,
          },
        },
        items: {
          include: {
            meetings: {
              include: {
                instructor: true,
                room: true,
              },
              orderBy: { number: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Cronograma não encontrado.');
    }

    return schedule;
  }
}
