import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';
import PageHeader from '@/components/PageHeader';

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
    <html lang="fr">
      <body className="bg-slate-50">
        <Navigation />
        <main className="min-h-screen pl-0 pr-4 pt-6 md:pl-[110px]">
          <div className="mx-auto max-w-7xl">
            <PageHeader />
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
