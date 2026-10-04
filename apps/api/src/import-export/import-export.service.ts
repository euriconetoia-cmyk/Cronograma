import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { MeetingType, ScheduleItemType } from '@cronograma/database';
import { DatabaseService } from '../database/database.service';
import { VersioningService } from '../schedules/versioning.service';
import { ApplyScheduleImportDto } from './dto/apply-schedule-import.dto';
import { importRowErrors, validDate } from './import-validation';
import { assertScheduleEditable, lockEditableSchedule } from '../schedules/schedule-protection';
import { validateSchedule } from '@cronograma/validation-engine';
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
      { header: 'Tipo encontro', key: 'meetingType', width: 18 },
      { header: 'Ordem item', key: 'itemOrder', width: 12 },
      { header: 'ID UC', key: 'curricularUnitId', width: 28 },
      { header: 'CH encontro', key: 'meetingHours', width: 14 },
    ];

    for (const item of schedule.items) {
      if (item.meetings.length === 0) {
        sheet.addRow({
          classCode: schedule.classGroup.code,
          course: schedule.classGroup.course.name,
          matrix: schedule.classGroup.courseVersion.name,
          title: item.title,
          itemOrder: item.order,
          curricularUnitId: item.curricularUnitId ?? '',
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
          itemOrder: item.order,
          curricularUnitId: item.curricularUnitId ?? '',
          type: item.type,
          hours: item.totalHours,
          startDate: this.toDate(item.startDate),
          endDate: this.toDate(item.endDate),
          avaEndDate: item.avaEndDate ? this.toDate(item.avaEndDate) : '',
          meetingNumber: meeting.number,
          meetingType: meeting.type,
          meetingHours: meeting.hours,
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
      'Turma',
      'Curso',
      'Matriz',
      'Item',
      'Tipo',
      'CH',
      'Inicio',
      'Termino',
      'Fim AVA',
      'Encontro',
      'Data encontro',
      'Horario',
      'Instrutor',
      'Sala/Lab',
      'Tipo encontro',
      'Ordem item',
      'ID UC',
      'CH encontro',
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
          meeting?.type ?? '',
          String(item.order),
          item.curricularUnitId ?? '',
          meeting ? String(meeting.hours) : '',
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
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

    const sheet = workbook.worksheets[0];
    if (!sheet) {
      throw new BadRequestException('A planilha não possui abas legíveis.');
    }

    const headerRow = this.findHeaderRow(sheet);
    if (!headerRow) {
      throw new BadRequestException('Não foi possível identificar o cabeçalho da planilha.');
    }

    const headers = Array.from({ length: headerRow.cellCount }, (_, index) =>
      String(headerRow.getCell(index + 1).value ?? '').trim(),
    );
    const namedHeaders = headers.filter(Boolean).map((header) => this.normalizeHeader(header));
    if (new Set(namedHeaders).size !== namedHeaders.length) {
      throw new BadRequestException('A planilha possui cabeçalhos duplicados.');
    }

    const template = this.detectTemplate(headers);
    const mapping = this.detectMapping(headers);
    const rows: ImportPreviewRow[] = [];

    for (let rowNumber = headerRow.number + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
      const row = sheet.getRow(rowNumber);
      const raw: Record<string, unknown> = {};

      headers.forEach((header, index) => {
        if (!header) return;
        raw[header] = row.getCell(index + 1).value ?? null;
      });

      if (Object.values(raw).every((value) => value === null || value === '')) continue;

      const normalized = this.normalizeRow(raw, mapping);
      const errors = importRowErrors(normalized);
      const warnings: string[] = [];

      if (normalized.totalHours == null) warnings.push('Carga horária não identificada.');
      if (!normalized.course) warnings.push('Curso não identificado.');

      rows.push({
        rowNumber,
        raw,
        normalized,
        errors,
        warnings,
      });
    }

    if (rows.length > 5000)
      throw new BadRequestException('A planilha excede o limite de 5000 linhas.');
    return {
      fileName,
      template,
      sheetName: sheet.name,
      headers,
      mapping,
      totalRows: rows.length,
      validRows: rows.filter((row) => row.errors.length === 0).length,
      invalidRows: rows.filter((row) => row.errors.length > 0).length,
      rows,
    };
  }

  async applyScheduleImport(data: ApplyScheduleImportDto) {
    if (!data.rows.length || data.rows.length > 5000) {
      throw new BadRequestException('Envie entre 1 e 5000 linhas para importação.');
    }
    // Complete preflight runs before snapshots, deletion or any write.
    for (const [index, row] of data.rows.entries()) {
      const errors = importRowErrors({ ...row });
      if (errors.length) throw new BadRequestException(`Linha ${index + 1}: ${errors.join(' ')}`);
    }
    const classGroup = await this.database.classGroup.findUnique({
      where: { id: data.classGroupId },
      include: {
        course: true,
        academicCalendar: { include: { events: true } },
        courseVersion: {
          include: {
            modules: {
              orderBy: { order: 'asc' },
              include: { curricularUnits: { orderBy: { order: 'asc' } } },
            },
          },
        },
        schedule: { include: { items: { include: { meetings: true } } } },
      },
    });
    if (!classGroup) throw new NotFoundException('Turma n?o encontrada.');
    assertScheduleEditable(classGroup.schedule?.status);
    const units = classGroup.courseVersion.modules.flatMap((module) => module.curricularUnits);
    const people = await this.database.person.findMany({ where: { active: true } });
    const rooms = await this.database.room.findMany({
      where: { unitId: classGroup.unitId, active: true },
    });
    const resolveName = (
      name: string | undefined,
      resources: { id: string; name: string }[],
      label: string,
    ) => {
      if (!name) return undefined;
      const matches = resources.filter(
        (resource) => this.normalizeHeader(resource.name) === this.normalizeHeader(name),
      );
      if (matches.length !== 1)
        throw new BadRequestException(`${label} sem correspondência única: ${name}.`);
      return matches[0]!.id;
    };
    const grouped = new Map<
      string,
      {
        unit?: (typeof units)[number];
        rows: typeof data.rows;
        type: ScheduleItemType;
        title: string;
        order?: number;
      }
    >();
    for (const row of data.rows) {
      const type = row.itemType ?? ScheduleItemType.CURRICULAR_UNIT;
      const matches = units.filter((unit) =>
        row.curricularUnitId
          ? unit.id === row.curricularUnitId
          : this.normalizeHeader(unit.name) === this.normalizeHeader(row.curricularUnit),
      );
      if (type === 'CURRICULAR_UNIT' && matches.length !== 1) {
        throw new BadRequestException(
          `UC sem correspondência única na matriz: ${row.curricularUnit}.`,
        );
      }
      const unit = type === 'CURRICULAR_UNIT' ? matches[0] : undefined;
      const key = unit ? unit.id : `${type}:${row.curricularUnit}`;
      const group = grouped.get(key) ?? {
        unit,
        rows: [],
        type,
        title: unit?.name ?? row.curricularUnit,
        order: row.itemOrder,
      };
      const first = group.rows[0];
      if (
        first &&
        ['startDate', 'endDate', 'avaEndDate', 'totalHours', 'itemType', 'itemOrder'].some(
          (field) =>
            (first as unknown as Record<string, unknown>)[field] !==
            (row as unknown as Record<string, unknown>)[field],
        )
      ) {
        throw new BadRequestException(
          `Linhas de ${group.title} possuem períodos, tipo, ordem ou carga horária divergentes.`,
        );
      }
      group.rows.push(row);
      grouped.set(key, group);
    }
    if (units.some((unit) => !grouped.has(unit.id))) {
      throw new BadRequestException(
        'Importação incompleta: todas as UCs da matriz devem estar presentes para substituir o cronograma.',
      );
    }
    const missingItems =
      classGroup.schedule?.items.filter(
        (item) =>
          item.type !== 'CURRICULAR_UNIT' &&
          ![...grouped.values()].some(
            (group) => group.type === item.type && group.title === item.title,
          ),
      ) ?? [];
    if (missingItems.length) {
      throw new BadRequestException(
        `Importação incompleta: itens existentes ausentes: ${missingItems.map((item) => item.title).join(', ')}.`,
      );
    }
    const groups = [...grouped.values()];
    const explicitOrders = groups
      .map((group) => group.order)
      .filter((order): order is number => order != null);
    if (
      explicitOrders.length &&
      (explicitOrders.length !== groups.length || new Set(explicitOrders).size !== groups.length)
    ) {
      throw new BadRequestException('Informe uma ordem distinta para cada item do cronograma.');
    }
    if (explicitOrders.length) groups.sort((a, b) => a.order! - b.order!);
    const importedItems = groups.map((group, index) => {
      const first = group.rows[0]!;
      const existingItem = classGroup.schedule?.items.find((item) =>
        group.unit
          ? item.curricularUnitId === group.unit.id
          : item.type === group.type && item.title === group.title,
      );
      const meetingRows = group.rows.filter((row) => row.meetingNumber != null);
      const existingCount = existingItem?.meetings.length ?? 0;
      if (meetingRows.length < Math.max(existingCount, group.unit?.meetingCount ?? 0)) {
        throw new BadRequestException(
          `Encontros ausentes em ${group.title}: a importação removeria encontros existentes ou obrigatórios.`,
        );
      }
      if (new Set(meetingRows.map((row) => row.meetingNumber)).size !== meetingRows.length) {
        throw new BadRequestException(`Número de encontro duplicado em ${group.title}.`);
      }
      const meetings = meetingRows.map((row) => {
        const previous = existingItem?.meetings.find(
          (meeting) => meeting.number === row.meetingNumber,
        );
        const inferredType =
          group.unit?.requiresWebClass && !group.unit.requiresInPerson
            ? MeetingType.WEB_CLASS
            : MeetingType.PRESENTIAL;
        return {
          number: row.meetingNumber!,
          type: row.meetingType ?? previous?.type ?? inferredType,
          date: this.parseDateInput(row.meetingDate!),
          startTime: row.meetingStartTime!,
          endTime: row.meetingEndTime!,
          hours:
            row.meetingHours ??
            (previous &&
            previous.startTime === row.meetingStartTime &&
            previous.endTime === row.meetingEndTime
              ? previous.hours
              : this.calculateHours(row.meetingStartTime!, row.meetingEndTime!)),
          instructorId: resolveName(row.instructor, people, 'Instrutor') ?? previous?.instructorId,
          roomId: resolveName(row.room, rooms, 'Sala/laboratório') ?? previous?.roomId,
        };
      });
      return {
        curricularUnitId: group.unit?.id,
        type: group.type,
        title: group.title,
        order: index + 1,
        startDate: this.parseDateInput(first.startDate),
        endDate: this.parseDateInput(first.endDate),
        avaEndDate: first.avaEndDate ? this.parseDateInput(first.avaEndDate) : null,
        totalHours: first.totalHours ?? group.unit?.totalHours ?? 0,
        manuallyAdjusted: true,
        adjustmentReason: 'Importado de planilha',
        meetings: { create: meetings },
      };
    });
    const issues = validateSchedule({
      courseTotalHours: classGroup.course.totalHours,
      matrixTotalHours: units.reduce((sum, unit) => sum + unit.totalHours, 0),
      academicYear: classGroup.academicCalendar.year,
      endDateLimit: classGroup.endDateLimit?.toISOString().slice(0, 10),
      restrictions: classGroup.academicCalendar.events.map((event) => ({
        startDate: this.toDate(event.startDate),
        endDate: this.toDate(event.endDate),
        blocksAcademicActivities: event.blocksAcademicActivities,
        reason: event.title,
      })),
      items: importedItems.map((item) => ({
        ...item,
        startDate: this.toDate(item.startDate),
        endDate: this.toDate(item.endDate),
        avaEndDate: item.avaEndDate ? this.toDate(item.avaEndDate) : undefined,
        expectedHours: units.find((unit) => unit.id === item.curricularUnitId)?.totalHours,
        meetings: item.meetings.create.map((meeting) => ({
          ...meeting,
          date: this.toDate(meeting.date),
        })),
      })),
    });
    const errors = issues.filter((issue) => issue.severity === 'ERROR');
    if (errors.length)
      throw new BadRequestException(errors.map((issue) => issue.message).join(' '));
    if (classGroup.schedule) {
      await this.versioning.createVersion(
        classGroup.schedule.id,
        data.actorName,
        'Snapshot anterior à importação de planilha',
      );
    }
    const schedule = await this.database.$transaction(async (tx) => {
      let scheduleId = classGroup.schedule?.id;
      if (scheduleId) {
        await lockEditableSchedule(tx, scheduleId);
        await tx.scheduleItem.deleteMany({ where: { scheduleId } });
      } else {
        const created = await tx.schedule.create({ data: { classGroupId: classGroup.id } });
        scheduleId = created.id;
      }
      for (const item of importedItems) {
        await tx.scheduleItem.create({ data: { scheduleId, ...item } });
      }
      const timestamps = importedItems.flatMap((item) => [
        item.startDate.getTime(),
        item.endDate.getTime(),
      ]);
      return tx.schedule.update({
        where: { id: scheduleId },
        data: {
          status: 'REVIEW',
          generatedAt: new Date(),
          startDate: new Date(Math.min(...timestamps)),
          endDate: new Date(Math.max(...timestamps)),
        },
        include: { items: { include: { meetings: true }, orderBy: { order: 'asc' } } },
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
        importedUnits: units.length,
      },
    );
    return { schedule, importedRows: data.rows.length, importedUnits: units.length };
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

      if (key === 'tipo') mapping.itemType = header;
      else if (key === 'ch encontro') mapping.meetingHours = header;
      else if (key === 'ordem item') mapping.itemOrder = header;
      else if (key === 'id uc') mapping.curricularUnitId = header;
      else if (key === 'tipo encontro') mapping.meetingType = header;
      else if (key === 'horario') mapping.meetingTime = header;
      else if (key === 'instrutor' || key === 'professor') mapping.instructor = header;
      else if (key === 'sala/lab' || key === 'sala') mapping.room = header;
      else if (!mapping.course && key.includes('curso')) mapping.course = header;
      else if (!mapping.module && key.includes('modulo')) mapping.module = header;
      else if (
        !mapping.curricularUnit &&
        (key === 'uc' ||
          key === 'item' ||
          key.includes('unidade curricular') ||
          key.includes('componente curricular'))
      )
        mapping.curricularUnit = header;
      else if (
        !mapping.meetingNumber &&
        key.includes('encontro') &&
        (key === 'encontro' || key.includes('numero') || key.includes('n '))
      )
        mapping.meetingNumber = header;
      else if (
        !mapping.meetingDate &&
        key.includes('data') &&
        (key.includes('encontro') || key.includes('presencial') || key.includes('webaula'))
      )
        mapping.meetingDate = header;
      else if (
        !mapping.meetingStartTime &&
        (key.includes('hora') || key.includes('horario')) &&
        key.includes('inicio')
      )
        mapping.meetingStartTime = header;
      else if (
        !mapping.meetingEndTime &&
        (key.includes('hora') || key.includes('horario')) &&
        (key.includes('fim') || key.includes('termino'))
      )
        mapping.meetingEndTime = header;
      else if (
        !mapping.totalHours &&
        (key === 'ch' ||
          key.includes('ch total') ||
          key.includes('carga horaria total') ||
          key.includes('carga horaria'))
      )
        mapping.totalHours = header;
      else if (
        !mapping.inPersonHours &&
        (key.includes('ch presencial') || key.includes('carga presencial'))
      )
        mapping.inPersonHours = header;
      else if (!mapping.eadHours && (key.includes('ch ead') || key.includes('carga ead')))
        mapping.eadHours = header;
      else if (
        !mapping.avaEndDate &&
        key.includes('ava') &&
        (key.includes('fim') || key.includes('termino'))
      )
        mapping.avaEndDate = header;
      else if (
        !mapping.startDate &&
        (key.includes('data inicio') || key.includes('inicio uc') || key === 'inicio')
      )
        mapping.startDate = header;
      else if (
        !mapping.endDate &&
        (key.includes('data termino') ||
          key.includes('data fim') ||
          key.includes('termino uc') ||
          key === 'termino' ||
          key === 'fim')
      )
        mapping.endDate = header;
      else if (
        !mapping.classCode &&
        (key.includes('codigo evento') ||
          key.includes('evento') ||
          key.includes('codigo turma') ||
          key === 'turma')
      )
        mapping.classCode = header;
      else if (!mapping.tutor && key.includes('tutor')) mapping.tutor = header;
      else if (!mapping.monitor && key.includes('monitor')) mapping.monitor = header;
      else if (!mapping.recovery && key.includes('recuperacao')) mapping.recovery = header;
    }

    return mapping;
  }

  private normalizeRow(raw: Record<string, unknown>, mapping: ImportColumnMapping) {
    const get = (field?: string) => (field ? (raw[field] ?? null) : null);
    const combinedTime = this.asText(get(mapping.meetingTime))?.split(/\s*[-–—]\s*/);

    return {
      course: this.asText(get(mapping.course)),
      module: this.asText(get(mapping.module)),
      curricularUnit: this.asText(get(mapping.curricularUnit)),
      curricularUnitId: this.asText(get(mapping.curricularUnitId)),
      itemType: this.asText(get(mapping.itemType)) ?? 'CURRICULAR_UNIT',
      itemOrder: this.asNumber(get(mapping.itemOrder)),
      meetingType: this.asText(get(mapping.meetingType)),
      meetingHours: this.asNumber(get(mapping.meetingHours)),
      instructor: this.asText(get(mapping.instructor)),
      room: this.asText(get(mapping.room)),
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
      meetingStartTime: this.asTime(get(mapping.meetingStartTime) ?? combinedTime?.[0]),
      meetingEndTime: this.asTime(get(mapping.meetingEndTime) ?? combinedTime?.[1]),
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
    if (!validDate(iso)) {
      throw new BadRequestException(`Data inválida na importação: ${value}`);
    }
    return new Date(`${iso}T12:00:00.000Z`);
  }

  private calculateHours(startTime: string, endTime: string) {
    const [startH = 0, startM = 0] = startTime.split(':').map(Number);
    const [endH = 0, endM = 0] = endTime.split(':').map(Number);
    return Math.max(1, Math.round((endH * 60 + endM - (startH * 60 + startM)) / 60));
  }

  private findHeaderRow(sheet: ExcelJS.Worksheet) {
    for (let i = 1; i <= Math.min(sheet.rowCount, 20); i += 1) {
      const row = sheet.getRow(i);
      const values = Array.from({ length: row.cellCount }, (_, index) =>
        String(row.getCell(index + 1).value ?? '').trim(),
      ).filter(Boolean);

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
