'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiGet, apiPost } from '../../../lib/api';

type Person = { id: string; name: string; email?: string };
type ClassPerson = { role: string; person: Person };
type ClassGroup = {
  id: string;
  code: string;
  course: { name: string };
  courseVersion: { name: string };
  unit: { name: string };
  modality: { name: string };
  academicCalendar: { name: string; year: number };
  scheduleRules: Array<{ weekday: string; startTime: string; endTime: string }>;
  people: ClassPerson[];
};

const roles = [
  ['INSTRUCTOR', 'Instrutor'],
  ['TUTOR', 'Tutor'],
  ['MONITOR', 'Monitor'],
  ['PLANNER', 'Planejamento'],
] as const;

export default function ClassDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [classGroup, setClassGroup] = useState<ClassGroup | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const [classData, peopleData] = await Promise.all([
      apiGet<ClassGroup>(`/classes/${id}`),
      apiGet<Person[]>('/people'),
    ]);
    setClassGroup(classData);
    setPeople(peopleData);
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function addPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      await apiPost(`/classes/${id}/people`, {
        personId: form.get('personId'),
        role: form.get('role'),
      });
      event.currentTarget.reset();
      setMessage('Pessoa vinculada à turma.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao vincular pessoa.');
    }
  }

  if (!classGroup) {
    return (
      <main className="calendar-page">
        <p>Carregando turma...</p>
      </main>
    );
  }

  return (
    <main className="calendar-page">
      <header className="calendar-header">
        <div>
          <p className="eyebrow">Turma</p>
          <h1>{classGroup.code}</h1>
          <p className="lead">
            {classGroup.course.name} | Matriz {classGroup.courseVersion.name}
          </p>
        </div>
        <div className="header-actions">
          <Link href={`/turmas/${id}/cronograma`}>Gerar cronograma</Link>
          <Link href={`/turmas/${id}/cronograma/editor`}>Editar cronograma</Link>
          <Link href={`/turmas/${id}/cronograma/workflow`}>Versionamento e aprovação</Link>
          <Link href={`/turmas/${id}/cronograma/recursos`}>Recursos e conflitos</Link>
          <Link href="/turmas">Voltar às turmas</Link>
        </div>
      </header>

      <section className="calendar-summary">
        <div>
          <span>Unidade</span>
          <strong>{classGroup.unit.name}</strong>
        </div>
        <div>
          <span>Modalidade</span>
          <strong>{classGroup.modality.name}</strong>
        </div>
        <div>
          <span>Calendário</span>
          <strong>{classGroup.academicCalendar.year}</strong>
        </div>
        <div>
          <span>Dias semanais</span>
          <strong>{classGroup.scheduleRules.length}</strong>
        </div>
      </section>

      <section className="calendar-forms">
        <form className="form-card" onSubmit={addPerson}>
          <h2>Vincular equipe</h2>
          <label>
            Pessoa
            <select name="personId" required>
              <option value="">Selecione</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Função
            <select name="role" required>
              {roles.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Vincular pessoa</button>
          {message && <p className="form-message">{message}</p>}
        </form>

        <article className="form-card">
          <h2>Equipe atual</h2>
          {classGroup.people.length === 0 ? (
            <p className="muted">Nenhuma pessoa vinculada.</p>
          ) : (
            <ul className="event-list">
              {classGroup.people.map((link) => (
                <li key={`${link.person.id}-${link.role}`}>
                  <strong>{link.person.name}</strong>
                  <span>{roles.find(([value]) => value === link.role)?.[1] ?? link.role}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="form-card">
        <h2>Funcionamento semanal</h2>
        <div className="weekday-grid">
          {classGroup.scheduleRules.map((rule) => (
            <article className="weekday-card" key={rule.weekday}>
              <strong>{rule.weekday}</strong>
              <span>
                {rule.startTime} às {rule.endTime}
              </span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
