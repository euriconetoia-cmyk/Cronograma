'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '../../lib/api';

type DashboardData = {
  filters: { year: number | null; unitId: string | null };
  totals: {
    classes: number;
    courses: number;
    plannedHours: number;
    schedules: number;
    rooms: number;
    people: number;
    meetings: number;
    conflicts: number;
    criticalConflicts: number;
  };
  classesByStatus: Record<string, number>;
  classesByModality: Record<string, number>;
  classesByUnit: Record<string, number>;
  schedulesByStatus: Record<string, number>;
};

export default function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<DashboardData | null>(null);
  const [message, setMessage] = useState('');

  async function load(selectedYear = year) {
    try {
      setData(await apiGet<DashboardData>(`/reports/dashboard?year=${selectedYear}`));
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao carregar dashboard.');
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
          <h1>Dashboard Gerencial</h1>
          <p className="lead">
            Visão consolidada do planejamento acadêmico, cronogramas, recursos e carga planejada.
          </p>
        </div>
        <Link href="/">Início</Link>
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

      {data && (
        <>
          <section className="metric-grid">
            <Metric label="Turmas" value={data.totals.classes} />
            <Metric label="Cursos ativos" value={data.totals.courses} />
            <Metric label="CH planejada" value={`${data.totals.plannedHours} h`} />
            <Metric label="Cronogramas" value={data.totals.schedules} />
            <Metric label="Encontros" value={data.totals.meetings} />
            <Metric label="Pessoas" value={data.totals.people} />
            <Metric label="Salas/Labs" value={data.totals.rooms} />
            <Metric label="Conflitos" value={data.totals.conflicts} />
            <Metric label="Críticos" value={data.totals.criticalConflicts} />
          </section>

          <section className="dashboard-sections">
            <Distribution title="Turmas por status" values={data.classesByStatus} />
            <Distribution title="Turmas por modalidade" values={data.classesByModality} />
            <Distribution title="Turmas por unidade" values={data.classesByUnit} />
            <Distribution title="Cronogramas por status" values={data.schedulesByStatus} />
          </section>

          <section className="quick-links">
            <Link className="card" href="/planejamento-anual">
              <span>Visão anual</span>
              <h2>Planejamento Anual</h2>
              <p>Distribuição de turmas e carga por mês.</p>
            </Link>
            <Link className="card" href="/relatorios">
              <span>Análise operacional</span>
              <h2>Relatórios</h2>
              <p>Carga de instrutores e ocupação de recursos.</p>
            </Link>
            <Link className="card" href="/turmas">
              <span>Operação</span>
              <h2>Turmas</h2>
              <p>Acesse planejamento e cronogramas.</p>
            </Link>
          </section>
        </>
      )}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Distribution({ title, values }: { title: string; values: Record<string, number> }) {
  const entries = Object.entries(values).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, value]) => value), 1);

  return (
    <article className="report-card">
      <h2>{title}</h2>
      {entries.length === 0 ? (
        <p className="muted">Sem dados no período.</p>
      ) : (
        <div className="bar-list">
          {entries.map(([label, value]) => (
            <div className="bar-row" key={label}>
              <div className="bar-label">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(value / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
