'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../../lib/api';

type Unit = {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  active: boolean;
};

export default function UnitsPage() {
  const [items, setItems] = useState<Unit[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    setItems(await apiGet<Unit[]>('/units'));
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      await apiPost('/units', {
        name: form.get('name'),
        code: form.get('code'),
        city: form.get('city'),
        state: String(form.get('state')).toUpperCase(),
      });
      event.currentTarget.reset();
      setMessage('Unidade cadastrada.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao cadastrar unidade.');
    }
  }

  return (
    <>
      <p className="eyebrow">Catálogo</p>
      <h1>Unidades</h1>
      <form className="form-card" onSubmit={submit}>
        <div className="form-grid">
          <label>Nome<input name="name" required /></label>
          <label>Código<input name="code" required /></label>
          <label>Cidade<input name="city" required /></label>
          <label>UF<input name="state" maxLength={2} required /></label>
        </div>
        <button type="submit">Cadastrar unidade</button>
        {message && <p className="form-message">{message}</p>}
      </form>

      <div className="table-card">
        <table>
          <thead><tr><th>Nome</th><th>Código</th><th>Cidade</th><th>UF</th><th>Status</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td><td>{item.code}</td><td>{item.city}</td>
                <td>{item.state}</td><td>{item.active ? 'Ativa' : 'Inativa'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
