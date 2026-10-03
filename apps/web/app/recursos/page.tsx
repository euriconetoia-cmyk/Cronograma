'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPost } from '../../lib/api';

type Unit = { id: string; name: string };
type Person = { id: string; name: string };
type Room = {
  id: string;
  name: string;
  code: string;
  type: string;
  capacity?: number;
  unit: Unit;
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

export default function ResourcesPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const [unitData, peopleData, roomData] = await Promise.all([
      apiGet<Unit[]>('/units'),
      apiGet<Person[]>('/people'),
      apiGet<Room[]>('/rooms'),
    ]);
    setUnits(unitData);
    setPeople(peopleData);
    setRooms(roomData);
  }

  useEffect(() => { void load(); }, []);

  async function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await apiPost('/rooms', {
        name: form.get('name'),
        code: form.get('code'),
        type: form.get('type'),
        capacity: Number(form.get('capacity') || 0) || undefined,
        unitId: form.get('unitId'),
      });
      event.currentTarget.reset();
      setMessage('Sala ou laboratório cadastrado.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao cadastrar recurso.');
    }
  }

  async function createAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const personId = String(form.get('personId'));
    try {
      await apiPost(`/people/${personId}/availability`, {
        weekday: form.get('weekday'),
        startTime: form.get('startTime'),
        endTime: form.get('endTime'),
      });
      event.currentTarget.reset();
      setMessage('Disponibilidade cadastrada.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao cadastrar disponibilidade.');
    }
  }

  return (
    <main className="calendar-page">
      <header className="calendar-header">
        <div>
          <p className="eyebrow">Recursos</p>
          <h1>Salas, Laboratórios e Disponibilidade</h1>
          <p className="lead">
            Cadastre recursos físicos e janelas de disponibilidade para validação dos encontros.
          </p>
        </div>
        <Link href="/">Início</Link>
      </header>

      {message && <p className="form-message">{message}</p>}

      <section className="calendar-forms">
        <form className="form-card" onSubmit={createRoom}>
          <h2>Nova sala ou laboratório</h2>
          <label>Nome<input name="name" required /></label>
          <label>Código<input name="code" required /></label>
          <label>Tipo
            <select name="type" required>
              <option value="CLASSROOM">Sala de aula</option>
              <option value="COMPUTER_LAB">Laboratório de informática</option>
              <option value="NETWORK_LAB">Laboratório de redes</option>
              <option value="ELECTRICAL_LAB">Laboratório elétrico</option>
              <option value="WORKSHOP">Oficina</option>
              <option value="OTHER">Outro</option>
            </select>
          </label>
          <label>Capacidade<input name="capacity" type="number" min="1" /></label>
          <label>Unidade
            <select name="unitId" required>
              <option value="">Selecione</option>
              {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
            </select>
          </label>
          <button type="submit">Cadastrar recurso</button>
        </form>

        <form className="form-card" onSubmit={createAvailability}>
          <h2>Disponibilidade de profissional</h2>
          <label>Pessoa
            <select name="personId" required>
              <option value="">Selecione</option>
              {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
            </select>
          </label>
          <label>Dia
            <select name="weekday" required>
              {weekdays.map(([value,label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <div className="form-grid">
            <label>Início<input name="startTime" type="time" required /></label>
            <label>Término<input name="endTime" type="time" required /></label>
          </div>
          <button type="submit">Cadastrar disponibilidade</button>
        </form>
      </section>

      <section className="table-card">
        <table>
          <thead><tr><th>Recurso</th><th>Código</th><th>Tipo</th><th>Capacidade</th><th>Unidade</th></tr></thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id}>
                <td>{room.name}</td>
                <td>{room.code}</td>
                <td>{room.type}</td>
                <td>{room.capacity ?? 'Não informada'}</td>
                <td>{room.unit.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
