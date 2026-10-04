'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPost } from '../../lib/api';

type Person = {
  id: string;
  name: string;
  email?: string;
  registry?: string;
};

export default function PeoplePage() {
  const [items, setItems] = useState<Person[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    setItems(await apiGet<Person[]>('/people'));
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      await apiPost('/people', {
        name: form.get('name'),
        email: form.get('email') || undefined,
        registry: form.get('registry') || undefined,
      });
      event.currentTarget.reset();
      setMessage('Pessoa cadastrada.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao cadastrar pessoa.');
    }
  }

  return (
    <main className="calendar-page">
      <header className="calendar-header">
        <div>
          <p className="eyebrow">Recursos</p>
          <h1>Pessoas</h1>
          <p className="lead">
            Cadastre instrutores, tutores, monitores e responsáveis pelo planejamento.
          </p>
        </div>
        <Link href="/">Início</Link>
      </header>

      <form className="form-card" onSubmit={submit}>
        <div className="form-grid">
          <label>
            Nome
            <input name="name" required />
          </label>
          <label>
            E-mail
            <input name="email" type="email" />
          </label>
          <label>
            Matrícula ou registro
            <input name="registry" />
          </label>
        </div>
        <button type="submit">Cadastrar pessoa</button>
        {message && <p className="form-message">{message}</p>}
      </form>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Registro</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.email ?? 'Não informado'}</td>
                <td>{item.registry ?? 'Não informado'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
