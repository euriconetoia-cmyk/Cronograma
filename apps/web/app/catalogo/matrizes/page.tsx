'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../../lib/api';

type Course = { id: string; name: string };
type Version = {
  id: string;
  name: string;
  course: Course;
  modules: Array<{
    id: string;
    name: string;
    curricularUnits: Array<{ id: string; name: string; totalHours: number }>;
  }>;
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

  useEffect(() => { void load(); }, []);

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

  return (
    <>
      <p className="eyebrow">Catálogo</p>
      <h1>Matrizes curriculares</h1>
      <form className="form-card" onSubmit={submitVersion}>
        <div className="form-grid">
          <label>Curso
            <select name="courseId" required>
              <option value="">Selecione</option>
              {courses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label>Versão<input name="name" placeholder="Ex.: 2027.1" required /></label>
        </div>
        <button type="submit">Criar versão</button>
        {message && <p className="form-message">{message}</p>}
      </form>

      <div className="matrix-list">
        {versions.map((version) => (
          <article className="card" key={version.id}>
            <span>{version.course.name}</span>
            <h2>{version.name}</h2>
            <p>{version.modules.length} módulo(s)</p>
            <p>{version.modules.reduce((total, module) => total + module.curricularUnits.length, 0)} UC(s)</p>
          </article>
        ))}
      </div>
    </>
  );
}
