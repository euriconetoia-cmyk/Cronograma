import type { Metadata } from 'next';
import './globals.css';
import { AdminShell } from './components/AdminShell';

export const metadata: Metadata = {
  title: 'Cronograma | Planejamento Acadêmico',
  description: 'Sistema de planejamento acadêmico e geração de cronogramas',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
