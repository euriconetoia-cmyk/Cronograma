import Link from 'next/link';

const links = [
  ['/catalogo', 'Visão geral'],
  ['/catalogo/unidades', 'Unidades'],
  ['/catalogo/modalidades', 'Modalidades'],
  ['/catalogo/cursos', 'Cursos'],
  ['/catalogo/matrizes', 'Matrizes'],
] as const;

export default function CatalogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="admin-shell">
      <aside className="admin-nav">
        <Link className="brand-link" href="/">Cronograma</Link>
        <p className="nav-caption">Catálogo acadêmico</p>
        {links.map(([href, label]) => (
          <Link key={href} href={href}>{label}</Link>
        ))}
      </aside>
      <section className="admin-content">{children}</section>
    </main>
  );
}
