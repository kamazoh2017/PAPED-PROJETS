import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'PAPE-D Project Tracker',
  description: 'Application de gestion des tâches et projets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="bg-slate-50">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
