'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiGet, apiPatch, apiPost } from '../../../../../lib/api';

type Issue = {
  code: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
};

type Item = {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  avaEndDate?: string | null;
  manuallyAdjusted: boolean;
  adjustmentReason?: string | null;
};

type Schedule = {
  id: string;
  items: Item[];
};

export default function ScheduleEditorPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const data = await apiGet<Schedule | null>(`/schedules/class/${id}`);
    setSchedule(data);
    if (data) {
      setIssues(await apiGet<Issue[]>(`/schedules/class/${id}/validate`));
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function updateItem(event: FormEvent<HTMLFormElement>, itemId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      await apiPatch(`/schedules/items/${itemId}`, {
        actorName: form.get('actorName'),
        startDate: form.get('startDate'),
        endDate: form.get('endDate'),
        avaEndDate: form.get('avaEndDate') || undefined,
        adjustmentReason: form.get('adjustmentReason'),
      });
      setMessage('Item atualizado. A validação foi recalculada.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao atualizar item.');
    }
  }

  async function regenerate() {
    try {
      await apiPost(`/schedules/class/${id}/generate`, {});
      setMessage('Cronograma regenerado pelas regras originais.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao regenerar cronograma.');
    }
  }

  if (!schedule) {
    return (
      <main className="calendar-page">
        <p>Nenhum cronograma salvo para esta turma.</p>
        <Link href={`/turmas/${id}/cronograma`}>Gerar cronograma</Link>
      </main>
    );
  }

  return (
    <main className="calendar-page">
      <header className="calendar-header">
        <div>
          <p className="eyebrow">Editor</p>
          <h1>Editor de Cronograma</h1>
          <p className="lead">
            Ajustes manuais ficam registrados. Use a regeneração para voltar às regras oficiais da turma.
          </p>
        </div>
        <div className="header-actions">
          <button type="button" onClick={() => void regenerate()}>Regenerar pelas regras</button>
          <Link href={`/turmas/${id}`}>Voltar à turma</Link>
        </div>
      </header>

      {message && <p className="form-message">{message}</p>}

      <section className="validation-panel">
        <h2>Validação do cronograma</h2>
        {issues.length === 0 ? (
          <p className="validation-ok">Nenhuma inconsistência encontrada.</p>
        ) : (
          <ul className="event-list">
            {issues.map((issue, index) => (
              <li key={`${issue.code}-${index}`} className={issue.severity === 'ERROR' ? 'blocked-event' : ''}>
                <strong>{issue.severity}</strong>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="schedule-list">
        {schedule.items.map((item) => (
          <form className="schedule-item-card" key={item.id} onSubmit={(event) => void updateItem(event, item.id)}>
            <div className="schedule-item-head">
              <div>
                <span>{item.type}</span>
                <h2>{item.title}</h2>
              </div>
              {item.manuallyAdjusted && <strong>Ajustado manualmente</strong>}
            </div>

            <div className="form-grid">
              <label>
                Início
                <input name="startDate" type="date" defaultValue={item.startDate.slice(0, 10)} required />
              </label>
              <label>
                Término
                <input name="endDate" type="date" defaultValue={item.endDate.slice(0, 10)} required />
              </label>
              <label>
                Encerramento AVA
                <input
                  name="avaEndDate"
                  type="date"
                  defaultValue={item.avaEndDate ? item.avaEndDate.slice(0, 10) : ''}
                />
              </label>
            </div>

            <div className="form-grid">
              <label>
                Autor do ajuste
                <input name="actorName" placeholder="Nome do responsável" required />
              </label>
              <label>
                Motivo do ajuste
              <input
                name="adjustmentReason"
                defaultValue={item.adjustmentReason ?? ''}
                placeholder="Ex.: ajuste por indisponibilidade de instrutor"
                required
              />
              </label>
            </div>

            <button type="submit">Salvar ajuste</button>
          </form>
        ))}
      </section>
    </main>
  );
}
