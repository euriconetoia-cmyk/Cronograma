'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiGet, apiPost } from '../../../../../lib/api';

type Version = {
  id: string;
  version: number;
  actorName: string;
  reason: string;
  createdAt: string;
};

type Approval = {
  id: string;
  decision: string;
  actorName: string;
  comment?: string | null;
  createdAt: string;
};

type Audit = {
  id: string;
  action: string;
  actorName: string;
  reason?: string | null;
  createdAt: string;
};

type History = {
  scheduleId: string;
  status: string;
  versions: Version[];
  approvals: Approval[];
  audit: Audit[];
};

const actions = [
  ['review', 'Enviar para revisão'],
  ['request-approval', 'Enviar para aprovação'],
  ['approve', 'Aprovar'],
  ['request-changes', 'Solicitar ajustes'],
  ['reject', 'Rejeitar'],
  ['publish', 'Publicar'],
] as const;

export default function WorkflowPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [history, setHistory] = useState<History | null>(null);
  const [message, setMessage] = useState('');

  async function load() {
    try {
      setHistory(await apiGet<History>(`/schedules/class/${id}/history`));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao carregar histórico.');
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const action = String(form.get('action'));

    try {
      await apiPost(`/schedules/class/${id}/${action}`, {
        actorName: form.get('actorName'),
        comment: form.get('comment') || undefined,
      });
      setMessage('Ação registrada com sucesso.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível executar a ação.');
    }
  }

  return (
    <main className="calendar-page">
      <header className="calendar-header">
        <div>
          <p className="eyebrow">Governança</p>
          <h1>Versionamento e Aprovação</h1>
          <p className="lead">
            Acompanhe o status do cronograma, decisões da coordenação e o histórico de alterações.
          </p>
        </div>
        <Link href={`/turmas/${id}`}>Voltar à turma</Link>
      </header>

      {message && <p className="form-message">{message}</p>}

      {history && (
        <>
          <section className="calendar-summary">
            <div>
              <span>Status atual</span>
              <strong>{history.status}</strong>
            </div>
            <div>
              <span>Versões</span>
              <strong>{history.versions.length}</strong>
            </div>
            <div>
              <span>Decisões</span>
              <strong>{history.approvals.length}</strong>
            </div>
            <div>
              <span>Auditoria</span>
              <strong>{history.audit.length}</strong>
            </div>
          </section>

          <form className="form-card" onSubmit={submit}>
            <h2>Registrar ação</h2>
            <div className="form-grid">
              <label>
                Autor
                <input name="actorName" placeholder="Nome do responsável" required />
              </label>
              <label>
                Ação
                <select name="action" required>
                  {actions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Comentário
              <textarea
                name="comment"
                rows={3}
                placeholder="Justificativa, orientação ou observação"
              />
            </label>
            <button type="submit">Registrar ação</button>
          </form>

          <section className="workflow-grid">
            <article className="form-card">
              <h2>Versões</h2>
              {history.versions.length === 0 ? (
                <p className="muted">Nenhuma versão registrada.</p>
              ) : (
                <ul className="timeline-list">
                  {history.versions.map((version) => (
                    <li key={version.id}>
                      <strong>Versão {version.version}</strong>
                      <span>{version.reason}</span>
                      <small>
                        {version.actorName} | {formatDateTime(version.createdAt)}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="form-card">
              <h2>Aprovações</h2>
              {history.approvals.length === 0 ? (
                <p className="muted">Nenhuma decisão registrada.</p>
              ) : (
                <ul className="timeline-list">
                  {history.approvals.map((approval) => (
                    <li key={approval.id}>
                      <strong>{approval.decision}</strong>
                      <span>{approval.comment || 'Sem comentário'}</span>
                      <small>
                        {approval.actorName} | {formatDateTime(approval.createdAt)}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>

          <section className="form-card">
            <h2>Trilha de auditoria</h2>
            {history.audit.length === 0 ? (
              <p className="muted">Nenhuma ação registrada.</p>
            ) : (
              <ul className="timeline-list">
                {history.audit.map((log) => (
                  <li key={log.id}>
                    <strong>{log.action}</strong>
                    <span>{log.reason || 'Sem justificativa'}</span>
                    <small>
                      {log.actorName} | {formatDateTime(log.createdAt)}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('pt-BR');
}
