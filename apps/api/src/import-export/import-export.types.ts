export type ImportTemplateType = 'TECHNICAL' | 'QUALIFICATION' | 'DAILY_DISTRIBUTION' | 'UNKNOWN';

export interface ImportColumnMapping {
  course?: string;
  module?: string;
  curricularUnit?: string;
  totalHours?: string;
  inPersonHours?: string;
  eadHours?: string;
  startDate?: string;
  endDate?: string;
  avaEndDate?: string;
  classCode?: string;
  tutor?: string;
  monitor?: string;
  meetingNumber?: string;
  meetingDate?: string;
  meetingStartTime?: string;
  meetingEndTime?: string;
  recovery?: string;
  itemType?: string;
  itemOrder?: string;
  curricularUnitId?: string;
  meetingType?: string;
  meetingHours?: string;
  meetingTime?: string;
  instructor?: string;
  room?: string;
}

export interface ImportPreviewRow {
  rowNumber: number;
  raw: Record<string, unknown>;
  normalized: Record<string, unknown>;
  errors: string[];
  warnings: string[];
}

export interface ImportPreview {
  fileName: string;
  template: ImportTemplateType;
  sheetName: string;
  headers: string[];
  mapping: ImportColumnMapping;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: ImportPreviewRow[];
}
