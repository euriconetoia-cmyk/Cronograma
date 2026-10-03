'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { API_URL, apiGet, apiPost } from '../../lib/api';

type ClassGroup = {
  id: string;
  code: string;
  course: { name: string };
  courseVersion: { name: string };
};

type PreviewRow = {
  rowNumber: number;
  normalized: {
    course?: string | null;
    module?: string | null;
    curricularUnit?: string | null;
    totalHours?: number | null;
    startDate?: string | null;
    endDate?: string | null;
    avaEndDate?: string | null;
    meetingNumber?: number | null;
    meetingDate?: string | null;
    meetingStartTime?: string | null;
    meetingEndTime?: string | null;
  };
  errors: string[];
  warnings: string[];
};

type Preview = {
  fileName: string;
  template: string;
  sheetName: string;
  headers: string[];
  mapping: Record<string, string>;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: PreviewRow[];
};

export default function ImportPage() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [classGroupId, setClassGroupId] = useState('');
  const [actorName, setActorName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void apiGet<ClassGroup[]>('/classes').then(setClasses);
  }, []);

  const validRows = useMemo(
    () => preview?.rows.filter((row) => row.errors.length === 0) ?? [],
    [preview],
  );

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get('file');

    if (!(file instanceof File)) return;

    setLoading(true);
    setMessage('');

    try {
      const body = new FormData();
      body.append('file', file);

      const response = await fetch(`${API_URL}/api/import-export/preview`, {
        method: 'POST',
        body,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message ?? 'Não foi possível analisar a planilha.');
      }

      setPreview(await response.json());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao analisar arquivo.');
    } finally {
      setLoading(false);
    }
  }

  async function apply() {
    if (!preview || !classGroupId || !actorName) {
      setMessage('Selecione a turma e informe o responsável pela importação.');
      return;
    }

    if (preview.invalidRows > 0) {
      setMessage('Corrija ou remova as linhas inválidas antes de confirmar a importação.');
      return;
    }

    const rows = validRows.map((row) => ({
      curricularUnit: String(row.normalized.curricularUnit ?? ''),
      totalHours: row.normalized.totalHours ?? undefined,
      startDate: String(row.normalized.startDate ?? ''),
      endDate: String(row.normalized.endDate ?? ''),
      avaEndDate: row.normalized.avaEndDate || undefined,
      meetingNumber: row.normalized.meetingNumber ?? undefined,
      meetingDate: row.normalized.meetingDate || undefined,
      meetingStartTime: row.normalized.meetingStartTime || undefined,
      meetingEndTime: row.normalized.meetingEndTime || undefined,
    }));

    setLoading(true);

    try {
      const result = await apiPost<{
        importedRows: number;
        importedUnits: number;
      }>('/import-export/apply', {
        classGroupId,
        actorName,
        rows,
      });

      setMessage(
        `Importação concluída: ${result.importedRows} linha(s) e ${result.importedUnits} UC(s).`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao confirmar importação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="calendar-page">
      <header className="calendar-header">
        <div>
          <p className="eyebrow">Migração</p>
          <h1>Importar Cronograma</h1>
          <p className="lead">
            Analise a planilha antes de gravar. O sistema identifica o modelo, mapeia colunas e valida as linhas.
          </p>
        </div>
        <Link href="/">Início</Link>
      </header>

      <form className="form-card" onSubmit={upload}>
        <h2>1. Selecionar planilha</h2>
        <label>
          Arquivo Excel
          <input name="file" type="file" accept=".xlsx" required />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Analisando...' : 'Analisar planilha'}
        </button>
      </form>

      {message && <p className="form-message">{message}</p>}

      {preview && (
        <>
          <section className="calendar-summary">
            <div><span>Modelo detectado</span><strong>{preview.template}</strong></div>
            <div><span>Linhas</span><strong>{preview.totalRows}</strong></div>
            <div><span>Válidas</span><strong>{preview.validRows}</strong></div>
            <div><span>Inválidas</span><strong>{preview.invalidRows}</strong></div>
          </section>

          <section className="form-card">
            <h2>2. Mapeamento detectado</h2>
            <div className="mapping-grid">
              {Object.entries(preview.mapping).map(([field, column]) => (
                <div key={field}>
                  <span>{field}</span>
                  <strong>{column}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="table-card">
            <h2>3. Prévia das linhas</h2>
            <table>
              <thead>
                <tr>
                  <th>Linha</th>
                  <th>UC</th>
                  <th>CH</th>
                  <th>Início</th>
                  <th>Término</th>
                  <th>Encontro</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td>{row.rowNumber}</td>
                    <td>{String(row.normalized.curricularUnit ?? '')}</td>
                    <td>{String(row.normalized.totalHours ?? '')}</td>
                    <td>{String(row.normalized.startDate ?? '')}</td>
                    <td>{String(row.normalized.endDate ?? '')}</td>
                    <td>{String(row.normalized.meetingNumber ?? '')}</td>
                    <td>
                      {row.errors.length > 0
                        ? row.errors.join(' ')
                        : row.warnings.length > 0
                          ? row.warnings.join(' ')
                          : 'Válida'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="form-card">
            <h2>4. Confirmar importação</h2>
            <div className="form-grid">
              <label>
                Turma de destino
                <select
                  value={classGroupId}
                  onChange={(event) => setClassGroupId(event.target.value)}
                  required
                >
                  <option value="">Selecione</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} | {item.course.name} | {item.courseVersion.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Responsável
                <input
                  value={actorName}
                  onChange={(event) => setActorName(event.target.value)}
                  placeholder="Nome de quem confirma a importação"
                  required
                />
              </label>
            </div>

            <p className="muted">
              A confirmação substitui os itens do cronograma da turma selecionada. Uma versão anterior é preservada quando já existe cronograma.
            </p>

            <button
              type="button"
              onClick={() => void apply()}
              disabled={loading || preview.invalidRows > 0}
            >
              Confirmar importação
            </button>
          </section>
        </>
      )}
    </main>
  );
}
