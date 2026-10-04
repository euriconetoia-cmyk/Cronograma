// Cria dados de exemplo pela API. Uso: node scripts/dados-exemplo.mjs
// A API precisa estar rodando (pnpm dev).
const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001') + '/api';

async function post(path, body) {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path}: ${JSON.stringify(data)}`);
  return data;
}

const unit = await post('/units', {
  name: 'SENAI Luziânia',
  code: 'LUZ',
  city: 'Luziânia',
  state: 'GO',
});
const modality = await post('/modalities', {
  name: 'Semipresencial',
  code: 'SEMI',
  allowsEad: true,
  allowsInPersonMeetings: true,
  allowsWebClasses: true,
  defaultDailyHours: 4,
});
const course = await post('/courses', {
  name: 'Técnico em Logística',
  code: 'TLOG',
  totalHours: 80,
  responsibleUnitId: unit.id,
  defaultModalityId: modality.id,
});
const version = await post('/curriculum/versions', { courseId: course.id, name: 'Matriz 2026' });
const mod = await post('/curriculum/modules', {
  courseVersionId: version.id,
  name: 'Módulo Básico',
  order: 1,
});
await post('/curriculum/units', {
  moduleId: mod.id,
  name: 'Fundamentos de Logística',
  order: 1,
  totalHours: 40,
  meetingCount: 5,
  meetingHours: 4,
  requiresInPerson: true,
  recoveryEnabled: true,
});
await post('/curriculum/units', {
  moduleId: mod.id,
  name: 'Gestão de Estoques',
  order: 2,
  totalHours: 40,
  meetingCount: 5,
  meetingHours: 4,
  requiresWebClass: true,
});
const cal = await post('/calendars', { name: 'Calendário 2026', year: 2026, unitId: unit.id });
for (const [title, date] of [
  ['Finados', '2026-11-02'],
  ['Proclamação da República', '2026-11-15'],
  ['Natal', '2026-12-25'],
]) {
  await post('/calendars/events', {
    calendarId: cal.id,
    type: 'NATIONAL_HOLIDAY',
    title,
    startDate: date,
    endDate: date,
    blocksAcademicActivities: true,
  });
}
const rules = [
  { weekday: 'MONDAY', startTime: '19:00', endTime: '23:00' },
  { weekday: 'WEDNESDAY', startTime: '19:00', endTime: '23:00' },
];
const base = {
  courseId: course.id,
  courseVersionId: version.id,
  unitId: unit.id,
  modalityId: modality.id,
  academicCalendarId: cal.id,
  startDate: '2026-10-26',
  scheduleRules: rules,
};
const t1 = await post('/classes', {
  ...base,
  code: 'TLOG-2026-1',
  generateRecovery: true,
  expectedStudents: 20,
});
const t2 = await post('/classes', { ...base, code: 'TLOG-2026-2', expectedStudents: 35 });
const person = await post('/people', { name: 'Prof. Carlos', email: 'carlos@senai.br' });
await post(`/people/${person.id}/availability`, {
  weekday: 'MONDAY',
  startTime: '19:00',
  endTime: '23:00',
});
await post('/rooms', {
  name: 'Sala 10',
  code: 'S10',
  type: 'CLASSROOM',
  capacity: 20,
  unitId: unit.id,
});
await post(`/schedules/class/${t1.id}/generate`, {});
await post(`/schedules/class/${t2.id}/generate`, {});

console.log('Dados de exemplo criados: 2 turmas de Técnico em Logística com cronograma gerado.');
console.log('Abra http://localhost:3000/turmas');
