'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { API_URL, apiGet, apiPost } from '../../../../lib/api';

type Meeting = {
  number: number;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
};

type ScheduleItem = {
  type: string;
  title: string;
  order: number;
  startDate: string;
  endDate: string;
  avaEndDate?: string;
  totalHours: number;
  meetings: Meeting[];
};

type Preview = {
  startDate: string;
  endDate: string;
  items: ScheduleItem[];
  warnings: string[];
};

export default function SchedulePreviewPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const data = await apiGet<Preview>(`/schedules/class/${id}/preview`);
      setPreview(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao gerar prévia.');
    }
  }

  useEffect(() => { void load(); }, [id]);

  async function save() {
    setSaving(true);
    try {
      await apiPost(`/schedules/class/${id}/generate`, {});
      setMessage('Cronograma gerado e salvo com sucesso.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao salvar cronograma.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="calendar-page">
      <header className="calendar-header">
        <div>
          <p className="eyebrow">Schedule Engine</p>
          <h1>Prévia do cronograma</h1>
          <p className="lead">
            Resultado calculado automaticamente a partir da matriz, calendário e regras da turma.
          </p>
        </div>
        <Link href={`/turmas/${id}`}>Voltar à turma</Link>
      </header>

      {message && <p className="form-message">{message}</p>}

      {!preview ? (
        <p>Calculando cronograma...</p>
      ) : (
        <>
          <section className="calendar-summary">
            <div><span>Início</span><strong>{formatDate(preview.startDate)}</strong></div>
            <div><span>Término</span><strong>{formatDate(preview.endDate)}</strong></div>
            <div><span>Itens</span><strong>{preview.items.length}</strong></div>
            <div><span>Alertas</span><strong>{preview.warnings.length}</strong></div>
          </section>

          {preview.warnings.length > 0 && (
            <section className="warning-box">
              <h2>Alertas da geração</h2>
              <ul>
                {preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            </section>
          )}

          <div className="schedule-actions">
            <a href={`${API_URL}/api/import-export/schedules/${id}.xlsx`}>Exportar Excel</a>
            <a href={`${API_URL}/api/import-export/schedules/${id}.csv`}>Exportar CSV</a>
            <Link href={`/turmas/${id}/cronograma/editor`}>Abrir editor</Link>
            <button type="button" onClick={() => void load()}>Recalcular prévia</button>
            <button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? 'Salvando...' : 'Gerar e salvar cronograma'}
            </button>
          </div>

          <section className="schedule-list">
            {preview.items.map((item) => (
              <article className="schedule-item-card" key={`${item.order}-${item.title}`}>
                <div className="schedule-item-head">
                  <div>
                    <span>{item.type === 'RECOVERY' ? 'Recuperação' : 'Unidade Curricular'}</span>
                    <h2>{item.order}. {item.title}</h2>
                  </div>
                  <strong>{item.totalHours} h</strong>
                </div>

                <div className="schedule-dates">
                  <div><span>Início</span><strong>{formatDate(item.startDate)}</strong></div>
                  <div><span>Término</span><strong>{formatDate(item.endDate)}</strong></div>
                  <div><span>AVA</span><strong>{item.avaEndDate ? formatDate(item.avaEndDate) : 'Não aplicável'}</strong></div>
                </div>

                {item.meetings.length > 0 && (
                  <div className="meeting-list">
                    <h3>Encontros</h3>
                    {item.meetings.map((meeting) => (
                      <div className="meeting-row" key={meeting.number}>
                        <strong>Encontro {meeting.number}</strong>
                        <span>{formatDate(meeting.date)}</span>
                        <span>{meeting.startTime} às {meeting.endTime}</span>
                        <span>{meeting.type}</span>
                      </div>
                    ))}
                  </div>
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
  return new Date(`${value}T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}
