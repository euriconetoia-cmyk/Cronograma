'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  match?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

type IconName =
  | 'dashboard'
  | 'calendar-range'
  | 'users'
  | 'schedule'
  | 'calendar'
  | 'book'
  | 'building'
  | 'layers'
  | 'person'
  | 'room'
  | 'warning'
  | 'report'
  | 'transfer'
  | 'settings'
  | 'chevron';

const groups: NavGroup[] = [
  {
    label: 'Visão geral',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
      { href: '/planejamento-anual', label: 'Planejamento anual', icon: 'calendar-range' },
    ],
  },
  {
    label: 'Planejamento',
    items: [
      { href: '/turmas', label: 'Turmas', icon: 'users' },
      { href: '/turmas', label: 'Cronogramas', icon: 'schedule', match: '/turmas/' },
      { href: '/calendarios', label: 'Calendário acadêmico', icon: 'calendar' },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { href: '/catalogo', label: 'Cursos e matrizes', icon: 'book', match: 'catalogo-core' },
      { href: '/catalogo/unidades', label: 'Unidades', icon: 'building' },
      { href: '/catalogo/modalidades', label: 'Modalidades', icon: 'layers' },
    ],
  },
  {
    label: 'Recursos',
    items: [
      { href: '/pessoas', label: 'Pessoas', icon: 'person' },
      { href: '/recursos', label: 'Salas e laboratórios', icon: 'room' },
    ],
  },
  {
    label: 'Controle',
    items: [
      { href: '/relatorios', label: 'Relatórios e conflitos', icon: 'report' },
    ],
  },
  {
    label: 'Dados',
    items: [
      { href: '/importar', label: 'Importar / Exportar', icon: 'transfer' },
    ],
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (item: NavItem) => {
    if (item.match === '/turmas/') return pathname.startsWith('/turmas/') && pathname !== '/turmas';
    if (item.match === 'catalogo-core') {
      return pathname === '/catalogo' || pathname.startsWith('/catalogo/cursos') || pathname.startsWith('/catalogo/matrizes');
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <Link href="/dashboard" className="sidebar-brand-link" aria-label="Planejamento Acadêmico">
            <span className="sidebar-brand-mark">S</span>
            {!collapsed && (
              <span className="sidebar-brand-copy">
                <strong>SENAI</strong>
                <small>Planejamento Acadêmico</small>
              </span>
            )}
          </Link>
          <button
            type="button"
            className="sidebar-collapse"
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            onClick={() => setCollapsed((value) => !value)}
          >
            <Icon name="chevron" />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Navegação principal">
          {groups.map((group) => (
            <div className="sidebar-group" key={group.label}>
              {!collapsed && <p className="sidebar-group-label">{group.label}</p>}
              <div className="sidebar-group-items">
                {group.items.map((item) => {
                  const active = isActive(item);
                  return (
                    <Link
                      key={`${group.label}-${item.label}`}
                      href={item.href}
                      className={`sidebar-item ${active ? 'active' : ''}`}
                      title={collapsed ? item.label : undefined}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className="sidebar-icon"><Icon name={item.icon} /></span>
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-avatar">EC</span>
            {!collapsed && (
              <span className="sidebar-user-copy">
                <strong>Eurico Carvalho</strong>
                <small>Planejamento</small>
              </span>
            )}
          </div>
          <Link href="/" className="sidebar-item" title={collapsed ? 'Configurações' : undefined}>
            <span className="sidebar-icon"><Icon name="settings" /></span>
            {!collapsed && <span>Configurações</span>}
          </Link>
        </div>
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="app-main">
        <header className="app-topbar">
          <button
            type="button"
            className="mobile-menu-button"
            aria-label="Abrir menu"
            onClick={() => setMobileOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
          <div className="app-topbar-copy">
            <strong>Sistema de Planejamento Acadêmico</strong>
            <span>Gestão de turmas e cronogramas</span>
          </div>
          <div className="app-topbar-context">
            <span className="environment-badge">Ambiente de planejamento</span>
          </div>
        </header>
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}

function Icon({ name }: { name: IconName }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  const paths: Record<IconName, ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="4" rx="1" /><rect x="14" y="11" width="7" height="10" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>,
    'calendar-range': <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M7 14h3M14 14h3M7 18h3" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    schedule: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" /><path d="M8 7h8M8 11h8" /></>,
    building: <><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 9h.01M15 9h.01M9 13h.01M15 13h.01" /></>,
    layers: <><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></>,
    person: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    room: <><path d="M3 21h18M5 21V5h14v16M9 9h6M9 13h6M9 17h2" /></>,
    warning: <><path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
    report: <><path d="M4 19V9M10 19V5M16 19v-7M22 19V3" /></>,
    transfer: <><path d="M7 7h11l-3-3M18 17H7l3 3" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3V9.6h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.34-1.88L4.2 6.56l2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1a1.7 1.7 0 0 0 1.1 1.5 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.2.36.5.7.9.9.3.2.7.3 1.1.3h.1v4h-.1a1.7 1.7 0 0 0-1.5 1.1Z" /></>,
    chevron: <path d="m15 18-6-6 6-6" />,
  };

  return <svg {...common}>{paths[name]}</svg>;
}
