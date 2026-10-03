'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../../../lib/api';

type Course = { id: string; name: string };
type CurricularUnit = { id: string; name: string; totalHours: number };
type Module = { id: string; name: string; order: number; curricularUnits: CurricularUnit[] };
type Version = {
  id: string;
  name: string;
  course: Course;
  modules: Module[];
};

export default function MatricesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const [courseData, versionData] = await Promise.all([
      apiGet<Course[]>('/courses'),
      apiGet<Version[]>('/curriculum/versions'),
    ]);
    setCourses(courseData);
    setVersions(versionData);
  }

  useEffect(() => {
    void load();
  }, []);

  const modules = useMemo(
    () => versions.flatMap((version) => version.modules),
    [versions],
  );

  async function submitVersion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      await apiPost('/curriculum/versions', {
        courseId: form.get('courseId'),
        name: form.get('name'),
      });
      event.currentTarget.reset();
      setMessage('Versão de matriz criada.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao criar matriz.');
    }
  }

  async function submitModule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      await apiPost('/curriculum/modules', {
        courseVersionId: form.get('courseVersionId'),
        name: form.get('name'),
        code: form.get('code') || undefined,
        order: Number(form.get('order')),
      });
      event.currentTarget.reset();
      setMessage('Módulo adicionado.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao criar módulo.');
    }
  }

  async function submitUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      await apiPost('/curriculum/units', {
        moduleId: form.get('moduleId'),
        name: form.get('name'),
        code: form.get('code') || undefined,
        order: Number(form.get('order')),
        totalHours: Number(form.get('totalHours')),
        inPersonHours: Number(form.get('inPersonHours') || 0),
        eadHours: Number(form.get('eadHours') || 0),
        meetingCount: Number(form.get('meetingCount') || 0),
        avaExtraDays: Number(form.get('avaExtraDays') || 0),
        requiresInPerson: form.get('requiresInPerson') === 'on',
        requiresWebClass: form.get('requiresWebClass') === 'on',
        recoveryEnabled: form.get('recoveryEnabled') === 'on',
      });
      event.currentTarget.reset();
      setMessage('Unidade Curricular adicionada.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao criar UC.');
    }
  }

  return (
    <>
      <p className="eyebrow">Catálogo</p>
      <h1>Matrizes curriculares</h1>
      <p className="lead">
        Crie a versão da matriz, organize os módulos e registre as Unidades Curriculares com suas cargas e regras iniciais.
      </p>

      <div className="three-column">
        <form className="form-card" onSubmit={submitVersion}>
          <h2>1. Nova versão</h2>
          <label>
            Curso
            <select name="courseId" required>
              <option value="">Selecione</option>
              {courses.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label>
            Versão
            <input name="name" placeholder="Ex.: 2027.1" required />
          </label>
          <button type="submit">Criar versão</button>
        </form>

        <form className="form-card" onSubmit={submitModule}>
          <h2>2. Novo módulo</h2>
          <label>
            Matriz
            <select name="courseVersionId" required>
              <option value="">Selecione</option>
              {versions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.course.name} | {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>Nome<input name="name" required /></label>
          <label>Código<input name="code" /></label>
          <label>Ordem<input name="order" type="number" min="1" required /></label>
          <button type="submit">Adicionar módulo</button>
        </form>

        <form className="form-card" onSubmit={submitUnit}>
          <h2>3. Nova UC</h2>
          <label>
            Módulo
            <select name="moduleId" required>
              <option value="">Selecione</option>
              {modules.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label>Nome<input name="name" required /></label>
          <div className="form-grid">
            <label>Código<input name="code" /></label>
            <label>Ordem<input name="order" type="number" min="1" required /></label>
            <label>CH total<input name="totalHours" type="number" min="1" required /></label>
            <label>CH presencial<input name="inPersonHours" type="number" min="0" defaultValue="0" /></label>
            <label>CH EaD<input name="eadHours" type="number" min="0" defaultValue="0" /></label>
            <label>Encontros<input name="meetingCount" type="number" min="0" defaultValue="0" /></label>
            <label>Dias extras AVA<input name="avaExtraDays" type="number" min="0" defaultValue="0" /></label>
          </div>
          <div className="check-grid">
            <label><input name="requiresInPerson" type="checkbox" /> Encontro presencial obrigatório</label>
            <label><input name="requiresWebClass" type="checkbox" /> Webaula obrigatória</label>
            <label><input name="recoveryEnabled" type="checkbox" /> Recuperação</label>
          </div>
          <button type="submit">Adicionar UC</button>
        </form>
      </div>

      {message && <p className="form-message">{message}</p>}

      <section className="matrix-list">
        {versions.map((version) => {
          const totalHours = version.modules.reduce(
            (sum, module) =>
              sum + module.curricularUnits.reduce((ucSum, unit) => ucSum + unit.totalHours, 0),
            0,
          );

          return (
            <article className="matrix-card" key={version.id}>
              <div>
                <span>{version.course.name}</span>
                <h2>Matriz {version.name}</h2>
                <p>{version.modules.length} módulo(s) | {totalHours} h cadastradas</p>
              </div>

              {version.modules.map((module) => (
                <div className="module-block" key={module.id}>
                  <strong>{module.order}. {module.name}</strong>
                  {module.curricularUnits.length === 0 ? (
                    <p>Sem UCs cadastradas.</p>
                  ) : (
                    <ul>
                      {module.curricularUnits.map((unit) => (
                        <li key={unit.id}>{unit.name} | {unit.totalHours} h</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </article>
          );
        })}
      </section>
    </>
  );
}
