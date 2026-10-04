'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../../lib/api';

type Modality = {
  id: string;
  name: string;
  code: string;
  allowsEad: boolean;
  allowsInPersonMeetings: boolean;
  allowsWebClasses: boolean;
};

export default function ModalitiesPage() {
  const [items, setItems] = useState<Modality[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    setItems(await apiGet<Modality[]>('/modalities'));
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      await apiPost('/modalities', {
        name: form.get('name'),
        code: form.get('code'),
        allowsEad: form.get('allowsEad') === 'on',
        allowsSynchronous: form.get('allowsSynchronous') === 'on',
        allowsInPersonMeetings: form.get('allowsInPersonMeetings') === 'on',
        allowsWebClasses: form.get('allowsWebClasses') === 'on',
        defaultDailyHours: Number(form.get('defaultDailyHours') || 0) || undefined,
        defaultAvaExtraDays: Number(form.get('defaultAvaExtraDays') || 0),
      });
      event.currentTarget.reset();
      setMessage('Modalidade cadastrada.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao cadastrar modalidade.');
    }
  }

  return (
    <>
      <p className="eyebrow">Catálogo</p>
      <h1>Modalidades</h1>
      <form className="form-card" onSubmit={submit}>
        <div className="form-grid">
          <label>
            Nome
            <input name="name" required />
          </label>
          <label>
            Código
            <input name="code" required />
          </label>
          <label>
            CH diária padrão
            <input name="defaultDailyHours" type="number" min="1" />
          </label>
          <label>
            Dias extras de AVA
            <input name="defaultAvaExtraDays" type="number" min="0" defaultValue="0" />
          </label>
        </div>
        <div className="check-grid">
          <label>
            <input name="allowsEad" type="checkbox" /> Permite EaD
          </label>
          <label>
            <input name="allowsSynchronous" type="checkbox" /> Permite síncrono
          </label>
          <label>
            <input name="allowsInPersonMeetings" type="checkbox" defaultChecked /> Permite encontros
            presenciais
          </label>
          <label>
            <input name="allowsWebClasses" type="checkbox" /> Permite webaulas
          </label>
        </div>
        <button type="submit">Cadastrar modalidade</button>
        {message && <p className="form-message">{message}</p>}
      </form>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Código</th>
              <th>EaD</th>
              <th>Presencial</th>
              <th>Webaula</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.code}</td>
                <td>{item.allowsEad ? 'Sim' : 'Não'}</td>
                <td>{item.allowsInPersonMeetings ? 'Sim' : 'Não'}</td>
                <td>{item.allowsWebClasses ? 'Sim' : 'Não'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
