'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Briefcase, Building2, Calendar, Coins, FolderKanban } from 'lucide-react';
import HistoriqueTimeline from '@/components/HistoriqueTimeline';

interface Entite { id: string; libelle: string; typeEntite?: string | null }
interface ProjetSummary {
  id: string;
  libelle: string;
  statut: string;
  etatAvancement: string;
  tauxAvancementReel: number;
  tauxAchevementReel: number;
  chefProjet: { id: string; nom: string; prenoms: string };
}

interface Programme {
  id: string;
  libelle: string;
  code: string | null;
  description: string | null;
  bailleur: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  budgetTotal: number | null;
  devise: string;
  statut: string;
  entite: Entite | null;
  projets: ProjetSummary[];
}

const STATUT_STYLE: Record<string, string> = {
  Actif:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  Clôturé: 'bg-slate-100 text-slate-600 border-slate-200',
  Archivé: 'bg-amber-50 text-amber-700 border-amber-200',
};

function fmtDate(d: string | null) { return d ? new Date(d).toLocaleDateString('fr-FR') : '—'; }
function fmtMoney(n: number | null, devise: string) {
  if (n === null) return '—';
  return new Intl.NumberFormat('fr-FR').format(n) + ' ' + devise;
}

export default function ProgrammeDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [activeTab, setActiveTab] = useState<'projets' | 'historique'>('projets');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/programmes/${id}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(setProgramme)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-center py-10 text-slate-500">Chargement…</p>;
  if (!programme) return (
    <div className="text-center py-20 text-slate-400">
      Programme introuvable. <Link href="/programmes" className="text-primary underline">Retour</Link>
    </div>
  );

  const tauxAvgAvancement = programme.projets.length
    ? Math.round(programme.projets.reduce((s, p) => s + p.tauxAvancementReel, 0) / programme.projets.length)
    : 0;
  const tauxAvgAchevement = programme.projets.length
    ? Math.round(programme.projets.reduce((s, p) => s + p.tauxAchevementReel, 0) / programme.projets.length)
    : 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/programmes" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary">
        <ArrowLeft size={16} /> Tous les programmes
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Briefcase size={22} /> {programme.libelle}
            </h1>
            {programme.code && <p className="text-xs text-slate-400 font-mono mt-0.5">{programme.code}</p>}
            {programme.bailleur && <p className="text-sm text-slate-600 mt-1">🏛 {programme.bailleur}</p>}
            {programme.description && <p className="text-sm text-slate-500 mt-2 whitespace-pre-wrap">{programme.description}</p>}
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${STATUT_STYLE[programme.statut] ?? 'border-slate-200 text-slate-600'}`}>
            {programme.statut}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 text-sm">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1"><Calendar size={11} className="inline mr-1" />Début</p>
            <p className="font-semibold text-slate-700">{fmtDate(programme.dateDebut)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1"><Calendar size={11} className="inline mr-1" />Fin</p>
            <p className="font-semibold text-slate-700">{fmtDate(programme.dateFin)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1"><Coins size={11} className="inline mr-1" />Budget</p>
            <p className="font-semibold text-slate-700">{fmtMoney(programme.budgetTotal, programme.devise)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1"><Building2 size={11} className="inline mr-1" />Entité pilote</p>
            <p className="font-semibold text-slate-700 truncate">{programme.entite?.libelle ?? '—'}</p>
          </div>
        </div>

        {/* Métriques agrégées */}
        {programme.projets.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Avancement moyen</span>
                <span className="font-bold text-emerald-600">{tauxAvgAvancement}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${tauxAvgAvancement}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Achèvement moyen</span>
                <span className="font-bold text-blue-600">{tauxAvgAchevement}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${tauxAvgAchevement}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Onglets */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1">
          {[
            { key: 'projets' as const, label: `Projets (${programme.projets.length})` },
            { key: 'historique' as const, label: 'Historique' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === t.key ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'projets' && (
        programme.projets.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl py-10 text-center text-sm text-slate-500">
            Aucun projet rattaché à ce programme.
            <br />
            <Link href="/projets" className="text-primary hover:underline mt-2 inline-block">
              Aller à la liste des projets
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Projet</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Chef</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Statut</th>
                  <th className="text-right px-4 py-2 font-medium text-slate-600">Avancement</th>
                  <th className="text-right px-4 py-2 font-medium text-slate-600">Achèvement</th>
                </tr>
              </thead>
              <tbody>
                {programme.projets.map(p => (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <Link href={`/projets/${p.id}`} className="text-primary hover:underline flex items-center gap-1">
                        <FolderKanban size={13} /> {p.libelle}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate-600">{p.chefProjet.prenoms} {p.chefProjet.nom}</td>
                    <td className="px-4 py-2"><span className="text-xs">{p.statut}</span></td>
                    <td className="px-4 py-2 text-right text-emerald-600 font-medium">{p.tauxAvancementReel}%</td>
                    <td className="px-4 py-2 text-right text-blue-600 font-medium">{p.tauxAchevementReel}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === 'historique' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-primary mb-4">Historique des modifications</h2>
          <HistoriqueTimeline table="Programme" id={programme.id} />
        </div>
      )}
    </div>
  );
}
