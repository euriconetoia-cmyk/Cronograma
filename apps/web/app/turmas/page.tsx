'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPost } from '../../lib/api';

type Unit = { id: string; name: string };
type Modality = { id: string; name: string };
type Course = { id: string; name: string };
type Version = { id: string; name: string; course: Course };
type Calendar = { id: string; name: string; year: number; unit: Unit };
type ClassGroup = {
  id: string;
  code: string;
  startDate: string;
  course: Course;
  courseVersion: Version;
  unit: Unit;
  modality: Modality;
  scheduleRules: Array<{ weekday: string; startTime: string; endTime: string }>;
};

const weekdays = [
  ['MONDAY', 'Segunda'],
  ['TUESDAY', 'Terça'],
  ['WEDNESDAY', 'Quarta'],
  ['THURSDAY', 'Quinta'],
  ['FRIDAY', 'Sexta'],
  ['SATURDAY', 'Sábado'],
  ['SUNDAY', 'Domingo'],
] as const;

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    const [classData, courseData, versionData, unitData, modalityData, calendarData] =
      await Promise.all([
        apiGet<ClassGroup[]>('/classes'),
        apiGet<Course[]>('/courses'),
        apiGet<Version[]>('/curriculum/versions'),
        apiGet<Unit[]>('/units'),
        apiGet<Modality[]>('/modalities'),
        apiGet<Calendar[]>('/calendars'),
      ]);

    setClasses(classData);
    setCourses(courseData);
    setVersions(versionData);
    setUnits(unitData);
    setModalities(modalityData);
    setCalendars(calendarData);
  }

  useEffect(() => {
    void load();
  }, []);

  const filteredVersions = useMemo(
    () => versions.filter((item) => !selectedCourse || item.course.id === selectedCourse),
    [versions, selectedCourse],
  );

  const filteredCalendars = useMemo(
    () => calendars.filter((item) => !selectedUnit || item.unit.id === selectedUnit),
    [calendars, selectedUnit],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const scheduleRules = weekdays
      .filter(([value]) => form.get(`enabled_${value}`) === 'on')
      .map(([value]) => ({
        weekday: value,
        startTime: form.get(`start_${value}`),
        endTime: form.get(`end_${value}`),
        maxDailyHours: Number(form.get(`max_${value}`) || 0) || undefined,
      }));

    try {
      await apiPost('/classes', {
        code: form.get('code'),
        courseId: form.get('courseId'),
        courseVersionId: form.get('courseVersionId'),
        unitId: form.get('unitId'),
        modalityId: form.get('modalityId'),
        academicCalendarId: form.get('academicCalendarId'),
        startDate: form.get('startDate'),
        endDateLimit: form.get('endDateLimit') || undefined,
        expectedStudents: Number(form.get('expectedStudents') || 0) || undefined,
        generateRecovery: form.get('generateRecovery') === 'on',
        createEnrollmentPeriod: form.get('createEnrollmentPeriod') === 'on',
        createInauguralClass: form.get('createInauguralClass') === 'on',
        avaExtraDays: Number(form.get('avaExtraDays') || 0),
        allowSaturday: form.get('allowSaturday') === 'on',
        allowSunday: form.get('allowSunday') === 'on',
        allowOverlap: form.get('allowOverlap') === 'on',
        allowNextUcDuringRecovery: form.get('allowNextUcDuringRecovery') === 'on',
        scheduleRules,
      });

      event.currentTarget.reset();
      setSelectedCourse('');
      setSelectedUnit('');
      setMessage('Turma cadastrada.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao cadastrar turma.');
    }
  }

  return (
    <main className="calendar-page">
      <header className="calendar-header">
        <div>
          <p className="eyebrow">Planejamento</p>
          <h1>Turmas</h1>
          <p className="lead">
            Conecte curso, matriz, unidade, modalidade, calendário e funcionamento semanal.
          </p>
        </div>
        <Link href="/">Início</Link>
      </header>

      <form className="form-card" onSubmit={submit}>
        <h2>Identificação</h2>
        <div className="form-grid">
          <label>
            Código ou evento
            <input name="code" required />
          </label>
          <label>
            Quantidade prevista de alunos
            <input name="expectedStudents" type="number" min="1" />
          </label>
          <label>
            Curso
            <select
              name="courseId"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              required
            >
              <option value="">Selecione</option>
              {courses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Matriz
            <select name="courseVersionId" required>
              <option value="">Selecione</option>
              {filteredVersions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Unidade
            <select
              name="unitId"
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              required
            >
              <option value="">Selecione</option>
              {units.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Modalidade
            <select name="modalityId" required>
              <option value="">Selecione</option>
              {modalities.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Calendário
            <select name="academicCalendarId" required>
              <option value="">Selecione</option>
              {filteredCalendars.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} | {item.year}
                </option>
              ))}
            </select>
          </label>
          <label>
            Data inicial
            <input name="startDate" type="date" required />
          </label>
          <label>
            Data limite
            <input name="endDateLimit" type="date" />
          </label>
        </div>

        <h2>Funcionamento semanal</h2>
        <div className="weekday-grid">
          {weekdays.map(([value, label]) => (
            <div className="weekday-card" key={value}>
              <label>
                <input name={`enabled_${value}`} type="checkbox" /> {label}
              </label>
              <label>
                Início
                <input name={`start_${value}`} type="time" defaultValue="19:00" />
              </label>
              <label>
                Término
                <input name={`end_${value}`} type="time" defaultValue="22:00" />
              </label>
              <label>
                CH máxima
                <input name={`max_${value}`} type="number" min="1" />
              </label>
            </div>
          ))}
        </div>

        <h2>Regras acadêmicas</h2>
        <div className="check-grid">
          <label>
            <input name="generateRecovery" type="checkbox" /> Gerar recuperação
          </label>
          <label>
            <input name="createEnrollmentPeriod" type="checkbox" /> Criar período de matrícula
          </label>
          <label>
            <input name="createInauguralClass" type="checkbox" /> Criar aula inaugural
          </label>
          <label>
            <input name="allowSaturday" type="checkbox" /> Permitir sábado
          </label>
          <label>
            <input name="allowSunday" type="checkbox" /> Permitir domingo
          </label>
          <label>
            <input name="allowOverlap" type="checkbox" /> Permitir sobreposição
          </label>
          <label>
            <input name="allowNextUcDuringRecovery" type="checkbox" /> Próxima UC durante
            recuperação
          </label>
        </div>
        <label>
          Dias adicionais de AVA
          <input name="avaExtraDays" type="number" min="0" defaultValue="0" />
        </label>

        <button type="submit">Criar turma</button>
        {message && <p className="form-message">{message}</p>}
      </form>

      <section className="table-card">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Curso</th>
              <th>Matriz</th>
              <th>Unidade</th>
              <th>Modalidade</th>
              <th>Início</th>
              <th>Dias</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link href={`/turmas/${item.id}`}>{item.code}</Link>
                </td>
                <td>{item.course.name}</td>
                <td>{item.courseVersion.name}</td>
                <td>{item.unit.name}</td>
                <td>{item.modality.name}</td>
                <td>{new Date(item.startDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                <td>{item.scheduleRules.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
