import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { DatabaseService } from '../database/database.service';
import type {
  ImportColumnMapping,
  ImportPreview,
  ImportPreviewRow,
  ImportTemplateType,
} from './import-export.types';

@Injectable()
export class ImportExportService {
  constructor(private readonly database: DatabaseService) {}

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
      else if (!mapping.curricularUnit && (key === 'uc' || key.includes('unidade curricular'))) mapping.curricularUnit = header;
      else if (!mapping.totalHours && key.includes('ch total')) mapping.totalHours = header;
      else if (!mapping.inPersonHours && key.includes('presencial')) mapping.inPersonHours = header;
      else if (!mapping.eadHours && key.includes('ead')) mapping.eadHours = header;
      else if (!mapping.avaEndDate && key.includes('ava') && key.includes('fim')) mapping.avaEndDate = header;
      else if (!mapping.startDate && key.includes('inicio')) mapping.startDate = header;
      else if (!mapping.endDate && key.includes('termino')) mapping.endDate = header;
      else if (!mapping.classCode && (key.includes('evento') || key.includes('turma'))) mapping.classCode = header;
      else if (!mapping.tutor && key.includes('tutor')) mapping.tutor = header;
      else if (!mapping.monitor && key.includes('monitor')) mapping.monitor = header;
      else if (!mapping.meetingNumber && key.includes('encontro') && key.includes('numero')) mapping.meetingNumber = header;
      else if (!mapping.meetingDate && key.includes('data') && key.includes('encontro')) mapping.meetingDate = header;
      else if (!mapping.meetingStartTime && key.includes('hora') && key.includes('inicio')) mapping.meetingStartTime = header;
      else if (!mapping.meetingEndTime && key.includes('hora') && key.includes('fim')) mapping.meetingEndTime = header;
      else if (!mapping.recovery && key.includes('recuperacao')) mapping.recovery = header;
    }

    return mapping;
  }

  private normalizeRow(raw: Record<string, unknown>, mapping: ImportColumnMapping) {
    const get = (field?: string) => (field ? raw[field] ?? null : null);

    return {
      course: get(mapping.course),
      module: get(mapping.module),
      curricularUnit: get(mapping.curricularUnit),
      totalHours: get(mapping.totalHours),
      inPersonHours: get(mapping.inPersonHours),
      eadHours: get(mapping.eadHours),
      startDate: get(mapping.startDate),
      endDate: get(mapping.endDate),
      avaEndDate: get(mapping.avaEndDate),
      classCode: get(mapping.classCode),
      tutor: get(mapping.tutor),
      monitor: get(mapping.monitor),
      recovery: get(mapping.recovery),
    };
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
