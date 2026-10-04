import Link from 'next/link';

const cards = [
  ['Unidades', 'Cadastre as unidades educacionais e suas identificações.', '/catalogo/unidades'],
  [
    'Modalidades',
    'Configure características que futuramente alimentarão o Schedule Engine.',
    '/catalogo/modalidades',
  ],
  [
    'Cursos',
    'Cadastre cursos, carga horária, unidade responsável e modalidade padrão.',
    '/catalogo/cursos',
  ],
  ['Matrizes', 'Crie versões, módulos e unidades curriculares.', '/catalogo/matrizes'],
] as const;

export default function CatalogPage() {
  return (
    <>
      <p className="eyebrow">Fase 1</p>
      <h1>Catálogo acadêmico</h1>
      <p className="lead">
        Esta área concentra os dados estruturais usados posteriormente para criar turmas e gerar
        cronogramas.
      </p>
      <div className="grid">
        {cards.map(([title, text, href]) => (
          <Link className="card card-link" href={href} key={href}>
            <span>Configuração</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
