'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '../../lib/api';

type AnnualItem = {
  id: string;
  code: string;
  course: string;
  unit: string;
  modality: string;
  startDate: string;
  endDate?: string;
  status: string;
};

type Month = {
  month: number;
  classes: number;
  plannedHours: number;
  schedules: number;
  items: AnnualItem[];
};

type AnnualData = {
  year: number;
  totals: {
    classes: number;
    plannedHours: number;
    schedules: number;
  };
  months: Month[];
};

const monthNames = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export default function AnnualPlanningPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<AnnualData | null>(null);
  const [message, setMessage] = useState('');

  async function load(selectedYear = year) {
    try {
      setData(await apiGet<AnnualData>(`/reports/annual-plan?year=${selectedYear}`));
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao carregar planejamento.');
    }
  }

  useEffect(() => {
    void load(currentYear);
  }, []);

  return (
    <main className="calendar-page">
      <header className="calendar-header">
        <div>
          <p className="eyebrow">Planejamento</p>
          <h1>Planejamento Anual</h1>
          <p className="lead">
            Visualize quando as turmas iniciam, a carga planejada e a distribuição das operações ao
            longo do ano.
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
          <section className="calendar-summary">
            <div>
              <span>Turmas</span>
              <strong>{data.totals.classes}</strong>
            </div>
            <div>
              <span>CH planejada</span>
              <strong>{data.totals.plannedHours} h</strong>
            </div>
            <div>
              <span>Cronogramas</span>
              <strong>{data.totals.schedules}</strong>
            </div>
            <div>
              <span>Ano</span>
              <strong>{data.year}</strong>
            </div>
          </section>

          <section className="annual-planning-grid">
            {data.months.map((month, index) => (
              <article className="annual-month" key={month.month}>
                <div className="annual-month-head">
                  <div>
                    <span>{String(month.month).padStart(2, '0')}</span>
                    <h2>{monthNames[index]}</h2>
                  </div>
                  <strong>{month.classes} turma(s)</strong>
                </div>

                <div className="month-kpis">
                  <span>{month.plannedHours} h planejadas</span>
                  <span>{month.schedules} cronograma(s)</span>
                </div>

                {month.items.length === 0 ? (
                  <p className="muted">Sem início de turma neste mês.</p>
                ) : (
                  <ul className="planning-list">
                    {month.items.map((item) => (
                      <li key={item.id}>
                        <Link href={`/turmas/${item.id}`}>
                          <strong>{item.code}</strong>
                          <span>{item.course}</span>
                          <small>
                            {formatDate(item.startDate)} | {item.unit}
                          </small>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`).toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
  });
}
