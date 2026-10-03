'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPost } from '../lib/api';

type Unit = { id: string; name: string };
type CalendarEvent = {
  id: string;
  type: string;
  title: string;
  startDate: string;
  endDate: string;
  blocksAcademicActivities: boolean;
  description?: string;
};
type AcademicCalendar = {
  id: string;
  name: string;
  year: number;
  unit: Unit;
  events: CalendarEvent[];
};

const eventTypes = [
  ['NATIONAL_HOLIDAY', 'Feriado nacional'],
  ['STATE_HOLIDAY', 'Feriado estadual'],
  ['MUNICIPAL_HOLIDAY', 'Feriado municipal'],
  ['RECESS', 'Recesso'],
  ['VACATION', 'Férias'],
  ['ACADEMIC_DAY', 'Dia letivo'],
  ['NON_ACADEMIC_DAY', 'Dia não letivo'],
  ['BLOCKED_DATE', 'Data bloqueada'],
  ['INSTITUTIONAL_EVENT', 'Evento institucional'],
] as const;

const monthNames = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

export default function CalendarsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [calendars, setCalendars] = useState<AcademicCalendar[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    const [unitData, calendarData] = await Promise.all([
      apiGet<Unit[]>('/units'),
      apiGet<AcademicCalendar[]>('/calendars'),
    ]);
    setUnits(unitData);
    setCalendars(calendarData);
    if (!selectedId && calendarData[0]) setSelectedId(calendarData[0].id);
  }

  useEffect(() => { void load(); }, []);

  const selected = calendars.find((item) => item.id === selectedId);

  const eventsByMonth = useMemo(() => {
    if (!selected) return new Map<number, CalendarEvent[]>();
    const map = new Map<number, CalendarEvent[]>();
    for (const event of selected.events) {
      const month = new Date(event.startDate).getUTCMonth();
      const list = map.get(month) ?? [];
      list.push(event);
      map.set(month, list);
    }
    return map;
  }, [selected]);

  async function submitCalendar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const created = await apiPost<AcademicCalendar>('/calendars', {
        name: form.get('name'),
        year: Number(form.get('year')),
        unitId: form.get('unitId'),
      });
      event.currentTarget.reset();
      setMessage('Calendário criado.');
      await load();
      setSelectedId(created.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao criar calendário.');
    }
  }

  async function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;
    const form = new FormData(event.currentTarget);

    try {
      await apiPost('/calendars/events', {
        calendarId: selectedId,
        type: form.get('type'),
        title: form.get('title'),
        startDate: form.get('startDate'),
        endDate: form.get('endDate'),
        blocksAcademicActivities: form.get('blocksAcademicActivities') === 'on',
        description: form.get('description') || undefined,
      });
      event.currentTarget.reset();
      setMessage('Evento acadêmico cadastrado.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao cadastrar evento.');
    }
  }

  return (
    <main className="calendar-page">
      <header className="calendar-header">
        <div>
          <p className="eyebrow">Planejamento</p>
          <h1>Calendário Acadêmico</h1>
          <p className="lead">
            Defina os dias que podem ou não receber atividades e alimente diretamente o Schedule Engine.
          </p>
        </div>
        <Link href="/catalogo">Voltar ao catálogo</Link>
      </header>

      <section className="calendar-forms">
        <form className="form-card" onSubmit={submitCalendar}>
          <h2>Novo calendário</h2>
          <label>Nome<input name="name" placeholder="Calendário Roberto Mange 2027" required /></label>
          <label>Ano<input name="year" type="number" min="2000" max="2100" required /></label>
          <label>
            Unidade
            <select name="unitId" required>
              <option value="">Selecione</option>
              {units.map((unit) => <option value={unit.id} key={unit.id}>{unit.name}</option>)}
            </select>
          </label>
          <button type="submit">Criar calendário</button>
        </form>

        <form className="form-card" onSubmit={submitEvent}>
          <h2>Novo evento</h2>
          <label>
            Calendário
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} required>
              <option value="">Selecione</option>
              {calendars.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.unit.name} | {item.year}
                </option>
              ))}
            </select>
          </label>
          <label>Tipo
            <select name="type" required>
              {eventTypes.map(([value,label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>Título<input name="title" required /></label>
          <div className="form-grid">
            <label>Início<input name="startDate" type="date" required /></label>
            <label>Término<input name="endDate" type="date" required /></label>
          </div>
          <label><input name="blocksAcademicActivities" type="checkbox" defaultChecked /> Bloqueia atividades acadêmicas</label>
          <label>Descrição<textarea name="description" rows={3} /></label>
          <button type="submit" disabled={!selectedId}>Adicionar evento</button>
        </form>
      </section>

      {message && <p className="form-message">{message}</p>}

      <section className="calendar-selector">
        <label>
          Calendário em visualização
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Selecione</option>
            {calendars.map((item) => (
              <option key={item.id} value={item.id}>{item.name} | {item.unit.name}</option>
            ))}
          </select>
        </label>
      </section>

      {selected && (
        <>
          <section className="calendar-summary">
            <div><span>Ano</span><strong>{selected.year}</strong></div>
            <div><span>Unidade</span><strong>{selected.unit.name}</strong></div>
            <div><span>Eventos</span><strong>{selected.events.length}</strong></div>
            <div>
              <span>Bloqueios</span>
              <strong>{selected.events.filter((event) => event.blocksAcademicActivities).length}</strong>
            </div>
          </section>

          <section className="annual-grid">
            {monthNames.map((month, index) => {
              const events = eventsByMonth.get(index) ?? [];
              return (
                <article className="month-card" key={month}>
                  <h2>{month}</h2>
                  {events.length === 0 ? (
                    <p className="muted">Sem eventos cadastrados.</p>
                  ) : (
                    <ul className="event-list">
                      {events.map((event) => (
                        <li key={event.id} className={event.blocksAcademicActivities ? 'blocked-event' : ''}>
                          <strong>{event.title}</strong>
                          <span>
                            {new Date(event.startDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                            {event.startDate !== event.endDate &&
                              ` a ${new Date(event.endDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`}
                          </span>
                          <small>{event.blocksAcademicActivities ? 'Bloqueia atividades' : 'Informativo'}</small>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </section>
        </>
      )}
    </main>
  );
}
