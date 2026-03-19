'use client';

import { ArrowLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

function getBreadcrumbLabels(pathname: string): string[] {
  if (pathname === '/connexion') return ['CONNEXION'];
  if (pathname === '/tableau-de-bord') return ['DASHBOARD'];
  if (pathname === '/projets') return ['PROJETS'];
  if (pathname === '/personnes') return ['RESOURCES'];
  if (pathname === '/entites') return ['ENTITE'];
  if (pathname === '/comptes-acces') return ['COMPTES-ACCES'];
  if (pathname.startsWith('/comptes-acces/autorisations/')) return ['COMPTES-ACCES', 'AUTORISATIONS'];
  if (pathname === '/profil') return ['PROFIL'];
  if (pathname.endsWith('/gantt')) return ['PROJETS', 'DETAIL-PROJET', 'GANTT'];
  if (pathname.startsWith('/projets/')) return ['PROJETS', 'DETAIL-PROJET'];
  return ['DASHBOARD'];
}

export default function PageHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const labels = getBreadcrumbLabels(pathname);
  const canGoBack = pathname !== '/tableau-de-bord';

  return (
    <header className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">
        <span className="text-primary">PAPE-D Project Tracker</span>
        {labels.map((label, index) => (
          <span key={`${label}-${index}`}> {'>'} <span>{label}</span></span>
        ))}
      </p>
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
    </header>
  );
}
