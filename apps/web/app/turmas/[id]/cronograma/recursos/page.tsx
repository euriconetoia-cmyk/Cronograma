'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiGet, apiPatch } from '../../../../../lib/api';

type Person = { id: string; name: string };
type Room = { id: string; name: string; code: string; unitId: string };
type Conflict = { code: string; severity: string; message: string };
type Meeting = {
  id: string;
  number: number;
  date: string;
  startTime: string;
  endTime: string;
  instructor?: Person | null;
  room?: Room | null;
};
type Item = { id: string; title: string; meetings: Meeting[] };
type Schedule = { items: Item[] };

export default function ScheduleResourcesPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const [scheduleData, peopleData, roomData, conflictData] = await Promise.all([
      apiGet<Schedule | null>(`/schedules/class/${id}`),
      apiGet<Person[]>('/people'),
      apiGet<Room[]>('/rooms'),
      apiGet<Conflict[]>(`/schedules/class/${id}/resource-conflicts`),
    ]);
    setSchedule(scheduleData);
    setPeople(peopleData);
    setRooms(roomData);
    setConflicts(conflictData);
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function assign(event: FormEvent<HTMLFormElement>, meetingId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      await apiPatch(`/schedules/meetings/${meetingId}/resources`, {
        instructorId: form.get('instructorId') || undefined,
        roomId: form.get('roomId') || undefined,
      });
      setMessage('Recursos do encontro atualizados.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao atualizar recursos.');
    }
  }

  return (
    <main className="calendar-page">
      <header className="calendar-header">
        <div>
          <p className="eyebrow">Recursos do cronograma</p>
          <h1>Instrutores, Salas e Conflitos</h1>
          <p className="lead">
            Aloque recursos aos encontros e valide automaticamente indisponibilidades e
            sobreposições.
          </p>
        </div>
        <Link href={`/turmas/${id}`}>Voltar à turma</Link>
      </header>

      {message && <p className="form-message">{message}</p>}

      <section className="validation-panel">
        <h2>Conflitos operacionais</h2>
        {conflicts.length === 0 ? (
          <p className="validation-ok">Nenhum conflito de recurso encontrado.</p>
        ) : (
          <ul className="event-list">
            {conflicts.map((conflict, index) => (
              <li className="blocked-event" key={`${conflict.code}-${index}`}>
                <strong>{conflict.code}</strong>
                <span>{conflict.message}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="schedule-list">
        {schedule?.items.flatMap((item) =>
          item.meetings.map((meeting) => (
            <form
              className="schedule-item-card"
              key={meeting.id}
              onSubmit={(event) => void assign(event, meeting.id)}
            >
              <div className="schedule-item-head">
                <div>
                  <span>{item.title}</span>
                  <h2>Encontro {meeting.number}</h2>
                </div>
                <strong>
                  {new Date(meeting.date).toLocaleDateString('pt-BR')} | {meeting.startTime} às{' '}
                  {meeting.endTime}
                </strong>
              </div>

              <div className="form-grid">
                <label>
                  Instrutor
                  <select name="instructorId" defaultValue={meeting.instructor?.id ?? ''}>
                    <option value="">Não definido</option>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Sala ou laboratório
                  <select name="roomId" defaultValue={meeting.room?.id ?? ''}>
                    <option value="">Não definido</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name} | {room.code}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button type="submit">Salvar recursos</button>
            </form>
          )),
        )}
      </section>
    </main>
  );
}
