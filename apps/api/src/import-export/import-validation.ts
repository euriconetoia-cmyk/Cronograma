import { MeetingType, ScheduleItemType } from '@cronograma/database';

export function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function importRowErrors(row: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!row.curricularUnit) errors.push('Unidade Curricular ou item não identificado.');
  for (const field of ['startDate', 'endDate']) {
    if (!validDate(row[field])) errors.push(`Data inválida: ${field}.`);
  }
  if (row.avaEndDate != null && row.avaEndDate !== '' && !validDate(row.avaEndDate))
    errors.push('Data inválida: Fim AVA.');
  if (validDate(row.startDate) && validDate(row.endDate) && row.endDate < row.startDate)
    errors.push('Término anterior ao início.');
  if (validDate(row.avaEndDate) && validDate(row.endDate) && row.avaEndDate < row.endDate)
    errors.push('Fim AVA anterior ao término.');
  if (row.itemType && !Object.values(ScheduleItemType).includes(row.itemType as ScheduleItemType))
    errors.push('Tipo de item inválido.');
  if (row.meetingType && !Object.values(MeetingType).includes(row.meetingType as MeetingType))
    errors.push('Tipo de encontro inválido.');
  if (
    row.meetingHours != null &&
    (!Number.isInteger(row.meetingHours) || Number(row.meetingHours) < 1)
  )
    errors.push('Carga horária do encontro inválida.');
  const fields = ['meetingNumber', 'meetingDate', 'meetingStartTime', 'meetingEndTime'];
  const hasMeeting =
    fields.some((field) => row[field] != null && row[field] !== '') || Boolean(row.meetingType);
  if (hasMeeting) {
    if (!fields.every((field) => row[field] != null && row[field] !== ''))
      errors.push('Encontro incompleto: informe número, data e horários de início e fim.');
    if (!Number.isInteger(row.meetingNumber) || Number(row.meetingNumber) < 1)
      errors.push('Número do encontro inválido.');
    if (!validDate(row.meetingDate)) errors.push('Data do encontro inválida.');
    if (
      validDate(row.meetingDate) &&
      validDate(row.startDate) &&
      validDate(row.endDate) &&
      (row.meetingDate < row.startDate || row.meetingDate > row.endDate)
    )
      errors.push('Encontro fora do período do item.');
    const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    if (
      !time.test(String(row.meetingStartTime)) ||
      !time.test(String(row.meetingEndTime)) ||
      String(row.meetingEndTime) <= String(row.meetingStartTime)
    )
      errors.push('Horário do encontro inválido.');
  }
  if (row.totalHours != null && (!Number.isInteger(row.totalHours) || Number(row.totalHours) < 0))
    errors.push('Carga horária inválida.');
  return errors;
}
