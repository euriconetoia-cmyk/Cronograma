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
          Fundação técnica criada. Os próximos incrementos transformarão cursos, matrizes,
          calendários e regras acadêmicas em cronogramas gerados automaticamente.
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
