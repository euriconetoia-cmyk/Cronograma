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

type ConflictData = {
  summary: {
    total: number;
    errors: number;
    warnings: number;
  };
  byCode: Record<string, number>;
};

export default function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [workload, setWorkload] = useState<Workload[]>([]);
  const [rooms, setRooms] = useState<RoomUsage[]>([]);
  const [conflicts, setConflicts] = useState<ConflictData | null>(null);
  const [message, setMessage] = useState('');

  async function load(selectedYear = year) {
    try {
      const [workloadData, roomData, conflictData] = await Promise.all([
        apiGet<Workload[]>(`/reports/workload?year=${selectedYear}`),
        apiGet<RoomUsage[]>(`/reports/room-usage?year=${selectedYear}`),
        apiGet<ConflictData>(`/reports/conflicts?year=${selectedYear}`),
      ]);
      setWorkload(workloadData);
      setRooms(roomData);
      setConflicts(conflictData);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao carregar relatórios.');
    }
  }

  useEffect(() => {
    void load(currentYear);
  }, []);

  return (
    <main className="calendar-page">
      <header className="calendar-header">
        <div>
          <p className="eyebrow">Gestão</p>
          <h1>Relatórios Operacionais</h1>
          <p className="lead">Analise carga de instrutores e utilização de salas e laboratórios.</p>
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
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </section>

      {message && <p className="form-message">{message}</p>}

      {conflicts && (
        <section className="calendar-summary">
          <div>
            <span>Conflitos</span>
            <strong>{conflicts.summary.total}</strong>
          </div>
          <div>
            <span>Erros críticos</span>
            <strong>{conflicts.summary.errors}</strong>
          </div>
          <div>
            <span>Alertas</span>
            <strong>{conflicts.summary.warnings}</strong>
          </div>
          <div>
            <span>Tipos</span>
            <strong>{Object.keys(conflicts.byCode).length}</strong>
          </div>
        </section>
      )}

      {conflicts && (
        <section className="report-card">
          <h2>Conflitos por tipo</h2>
          {Object.keys(conflicts.byCode).length === 0 ? (
            <p className="validation-ok">Nenhum conflito identificado.</p>
          ) : (
            <div className="bar-list">
              {Object.entries(conflicts.byCode)
                .sort((a, b) => b[1] - a[1])
                .map(([code, value]) => (
                  <div className="bar-row" key={code}>
                    <div className="bar-label">
                      <span>{code}</span>
                      <strong>{value}</strong>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      )}

      <section className="dashboard-sections">
        <article className="report-card">
          <h2>Carga de instrutores</h2>
          {workload.length === 0 ? (
            <p className="muted">Nenhum encontro com instrutor no período.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Instrutor</th>
                  <th>Encontros</th>
                  <th>Horas</th>
                </tr>
              </thead>
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
              <thead>
                <tr>
                  <th>Recurso</th>
                  <th>Encontros</th>
                  <th>Horas</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((item) => (
                  <tr key={item.roomId}>
                    <td>
                      {item.name} | {item.code}
                    </td>
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
