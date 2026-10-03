import Link from 'next/link';

const modules = [
  'Cursos e matrizes',
  'Calendários acadêmicos',
  'Turmas',
  'Schedule Engine',
  'Validation Engine',
  'Cronogramas',
];

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Cronograma SENAI</p>
        <h1>Planejamento acadêmico estruturado</h1>
        <p className="lead">
          A fundação técnica está pronta e o Catálogo Acadêmico já começou a ser implementado.
          Cursos, modalidades, unidades e matrizes alimentarão as próximas fases do Schedule Engine.
        </p>
        <p>
          <Link className="card-link" href="/catalogo">
            Acessar Catálogo Acadêmico
          </Link>
          {' | '}
          <Link className="card-link" href="/calendarios">
            Acessar Calendário Acadêmico
          </Link>
          {' | '}
          <Link className="card-link" href="/turmas">
            Acessar Turmas
          </Link>
          {' | '}
          <Link className="card-link" href="/pessoas">
            Acessar Pessoas
          </Link>
          {' | '}
          <Link className="card-link" href="/recursos">
            Acessar Recursos
          </Link>
          {' | '}
          <Link className="card-link" href="/dashboard">
            Dashboard
          </Link>
          {' | '}
          <Link className="card-link" href="/planejamento-anual">
            Planejamento Anual
          </Link>
          {' | '}
          <Link className="card-link" href="/relatorios">
            Relatórios
          </Link>
        </p>
      </section>

      <section className="grid" aria-label="Módulos planejados">
        {modules.map((module) => (
          <article className="card" key={module}>
            <span>Planejado</span>
            <h2>{module}</h2>
          </article>
        ))}
      </section>
    </main>
  );
}
