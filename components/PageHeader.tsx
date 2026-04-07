'use client';

import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function getBreadcrumbLabels(pathname: string): string[] {
  if (pathname === '/connexion') return ['CONNEXION'];
  if (pathname === '/tableau-de-bord') return ['DASHBOARD'];
  if (pathname === '/projets/tableau-de-bord') return ['PROJETS', 'DASHBOARD'];
  if (pathname === '/projets') return ['PROJETS', 'LISTE'];
  if (pathname === '/personnes') return ['RESOURCES'];
  if (pathname === '/entites') return ['ENTITE'];
  if (pathname === '/comptes-acces') return ['COMPTES-ACCES'];
  if (pathname.startsWith('/comptes-acces/autorisations/')) return ['COMPTES-ACCES', 'AUTORISATIONS'];
  if (pathname === '/profil') return ['PROFIL'];
  if (pathname === '/operations') return ['OPÉRATIONS', 'DASHBOARD'];
  if (pathname.startsWith('/operations/')) return ['OPÉRATIONS', 'DÉTAIL'];
  if (pathname === '/occurrences') return ['OPÉRATIONS', 'OCCURRENCES'];
  if (pathname.startsWith('/occurrences/')) return ['OPÉRATIONS', 'OCCURRENCES', 'DÉTAIL'];
  if (pathname.endsWith('/gantt')) return ['PROJETS', 'LISTE', 'GANTT'];
  if (pathname.startsWith('/projets/')) return ['PROJETS', 'DÉTAIL'];
  return ['DASHBOARD'];
}

export default function PageHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const labels = getBreadcrumbLabels(pathname);
  const canGoBack = pathname !== '/tableau-de-bord';
  const isProjetDashboard = pathname === '/projets/tableau-de-bord';
  const [dashboardView, setDashboardView] = useState<'projet' | 'taches'>('taches');

  const toggleDashboardFilters = () => {
    window.dispatchEvent(new CustomEvent('dashboard:toggle-filters'));
  };

  useEffect(() => {
    if (!isProjetDashboard) return;
    setDashboardView('taches');
    window.dispatchEvent(new CustomEvent('dashboard:set-view', { detail: { view: 'taches' } }));
  }, [isProjetDashboard]);

  const changeDashboardView = (view: 'projet' | 'taches') => {
    setDashboardView(view);
    window.dispatchEvent(new CustomEvent('dashboard:set-view', { detail: { view } }));
  };

  return (
    <header className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">
        <span className="text-primary">PAPE-D Project Tracker</span>
        {labels.map((label, index) => (
          <span key={`${label}-${index}`}> {'>'} <span>{label}</span></span>
        ))}
      </p>
      <div className="flex items-center gap-2">
        {isProjetDashboard && (
          <div className="inline-flex items-center rounded-full border border-slate-300 bg-white p-1">
            <button
              type="button"
              onClick={() => changeDashboardView('taches')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                dashboardView === 'taches' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Visualisation tâches"
            >
              Tâches
            </button>
            <button
              type="button"
              onClick={() => changeDashboardView('projet')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                dashboardView === 'projet' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Visualisation projets"
            >
              Projets
            </button>
          </div>
        )}

        {isProjetDashboard && (
          <button
            type="button"
            onClick={toggleDashboardFilters}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-slate-700"
            title="Filtres"
          >
            <SlidersHorizontal size={16} />
            Filtre
          </button>
        )}

        <button
          type="button"
          onClick={() => router.back()}
          disabled={!canGoBack}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            canGoBack
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow hover:opacity-95'
              : 'cursor-not-allowed bg-slate-200 text-slate-500'
          }`}
          title="Retour"
        >
          <ArrowLeft size={16} />
          Retour
        </button>
      </div>
    </header>
  );
}
