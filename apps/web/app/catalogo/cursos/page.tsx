'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../../lib/api';

type Unit = { id: string; name: string };
type Modality = { id: string; name: string };
type Course = {
  id: string;
  name: string;
  code: string;
  totalHours: number;
  responsibleUnit?: Unit;
  defaultModality?: Modality;
};

export default function CoursesPage() {
  const [items, setItems] = useState<Course[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const [coursesData, unitsData, modalitiesData] = await Promise.all([
      apiGet<Course[]>('/courses'),
      apiGet<Unit[]>('/units'),
      apiGet<Modality[]>('/modalities'),
    ]);
    setItems(coursesData);
    setUnits(unitsData);
    setModalities(modalitiesData);
  }

  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      await apiPost('/courses', {
        name: form.get('name'),
        code: form.get('code'),
        totalHours: Number(form.get('totalHours')),
        responsibleUnitId: form.get('responsibleUnitId') || undefined,
        defaultModalityId: form.get('defaultModalityId') || undefined,
      });
      event.currentTarget.reset();
      setMessage('Curso cadastrado.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao cadastrar curso.');
    }
  }

  return (
    <>
      <p className="eyebrow">Catálogo</p>
      <h1>Cursos</h1>
      <form className="form-card" onSubmit={submit}>
        <div className="form-grid">
          <label>Nome<input name="name" required /></label>
          <label>Código<input name="code" required /></label>
          <label>Carga horária<input name="totalHours" type="number" min="1" required /></label>
          <label>Unidade responsável
            <select name="responsibleUnitId">
              <option value="">Não definida</option>
              {units.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label>Modalidade padrão
            <select name="defaultModalityId">
              <option value="">Não definida</option>
              {modalities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        </div>
        <button type="submit">Cadastrar curso</button>
        {message && <p className="form-message">{message}</p>}
      </form>

      <div className="table-card">
        <table>
          <thead><tr><th>Curso</th><th>Código</th><th>CH</th><th>Unidade</th><th>Modalidade</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td><td>{item.code}</td><td>{item.totalHours} h</td>
                <td>{item.responsibleUnit?.name ?? 'Não definida'}</td>
                <td>{item.defaultModality?.name ?? 'Não definida'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
