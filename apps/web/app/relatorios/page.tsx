'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '../../lib/api';

type Workload = {
  instructorId: string;
  name: string;
  hours: number;
  meetings: number;
};

type RoomUsage = {
  roomId: string;
  name: string;
  code: string;
  hours: number;
  meetings: number;
};

export default function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [workload, setWorkload] = useState<Workload[]>([]);
  const [rooms, setRooms] = useState<RoomUsage[]>([]);
  const [message, setMessage] = useState('');

  async function load(selectedYear = year) {
    try {
      const [workloadData, roomData] = await Promise.all([
        apiGet<Workload[]>(`/reports/workload?year=${selectedYear}`),
        apiGet<RoomUsage[]>(`/reports/room-usage?year=${selectedYear}`),
      ]);
      setWorkload(workloadData);
      setRooms(roomData);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao carregar relatórios.');
    }
  }

  useEffect(() => { void load(currentYear); }, []);

  return (
    <main className="calendar-page">
      <header className="calendar-header">
        <div>
          <p className="eyebrow">Gestão</p>
          <h1>Relatórios Operacionais</h1>
          <p className="lead">
            Analise carga de instrutores e utilização de salas e laboratórios.
          </p>
        </div>
        <Link href="/dashboard">Dashboard</Link>
      </header>

      <section className="dashboard-filter">
        <label>
          Ano
          <select
            value={year}
            onChange={(event) => {
              const next = Number(event.target.value);
              setYear(next);
              void load(next);
            }}
          >
            {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
      </section>

      {message && <p className="form-message">{message}</p>}

      <section className="dashboard-sections">
        <article className="report-card">
          <h2>Carga de instrutores</h2>
          {workload.length === 0 ? (
            <p className="muted">Nenhum encontro com instrutor no período.</p>
          ) : (
            <table>
              <thead><tr><th>Instrutor</th><th>Encontros</th><th>Horas</th></tr></thead>
              <tbody>
                {workload.map((item) => (
                  <tr key={item.instructorId}>
                    <td>{item.name}</td>
                    <td>{item.meetings}</td>
                    <td>{item.hours} h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>

        <article className="report-card">
          <h2>Utilização de salas e laboratórios</h2>
          {rooms.length === 0 ? (
            <p className="muted">Nenhum recurso utilizado no período.</p>
          ) : (
            <table>
              <thead><tr><th>Recurso</th><th>Encontros</th><th>Horas</th></tr></thead>
              <tbody>
                {rooms.map((item) => (
                  <tr key={item.roomId}>
                    <td>{item.name} | {item.code}</td>
                    <td>{item.meetings}</td>
                    <td>{item.hours} h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>
      </section>
    </main>
  );
}
