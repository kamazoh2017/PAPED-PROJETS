'use client';

import Link from 'next/link';
import { AlertTriangle, CalendarCheck, CalendarClock, CheckCircle2, Clock, FolderOpen, Repeat2, User } from 'lucide-react';
import { useEffect, useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Entite { id: string; libelle: string; }

interface Tache {
  id: string;
  libelle: string;
  statut: string;
  priorite: string;
  dateFinPrevisionnelle?: string;
  projet?: { id: string; libelle: string };
  assigneA?: { id: string; nom: string; prenoms: string; entiteId?: string };
}

interface Occurrence {
  id: string;
  statut: string;
  datePrevue: string;
  dateEcheance: string;
  retardJours?: number | null;
  tacheOperationnelle: {
    id: string;
    libelle: string;
    operation: { id: string; libelle: string; entite?: { id: string; libelle: string } | null };
  };
}

interface Indicateurs {
  projetsActifs: number;
  tachesEnRetard: number;
  operationsActives: number;
  occsEnRetard: number;
  occsSemaine: number;
  tauxExecution30j: number | null;
  occsTotal30j: number;
  occsRealisees30j: number;
}

interface MaChargeTache {
  id: string;
  libelle: string;
  statut: string;
  priorite: string;
  dateFinPrevisionnelle?: string;
  projet?: { id: string; libelle: string; statut: string };
}

interface MaChargeOccurrence {
  id: string;
  statut: string;
  dateEcheance: string;
  tacheOperationnelle: {
    id: string;
    libelle: string;
    operation: { id: string; libelle: string };
  };
}

interface MaCharge {
  kpis: {
    tachesActives: number;
    tachesEnRetard: number;
    occurrencesActives: number;
    occsEnRetard: number;
    occsAujourdhui: number;
  };
  tachesProjet: MaChargeTache[];
  occurrences: MaChargeOccurrence[];
}

// ── Style maps ────────────────────────────────────────────────────────────────

const PRIORITE_STYLE: Record<string, string> = {
  Bloquant: 'bg-red-100 text-red-700',
  Critique: 'bg-orange-100 text-orange-700',
  Normal:   'bg-green-100 text-green-700',
};

const STATUT_TACHE_STYLE: Record<string, string> = {
  'À planifier': 'bg-slate-100 text-slate-500',
  'A faire':     'bg-blue-100 text-blue-600',
  'En cours':    'bg-amber-100 text-amber-700 font-semibold',
  'En attente':  'bg-violet-100 text-violet-600',
  'Terminé':     'bg-emerald-100 text-emerald-700',
  'Validé':      'bg-teal-100 text-teal-700 font-semibold',
};

const STATUT_OCC_STYLE: Record<string, string> = {
  'En retard':          'bg-red-100 text-red-700 font-semibold',
  'En cours':           'bg-amber-100 text-amber-700',
  'En attente':         'bg-blue-100 text-blue-600',
  'Réalisée':           'bg-emerald-100 text-emerald-700',
  'Réalisée en retard': 'bg-amber-100 text-amber-700',
  'Annulée':            'bg-slate-100 text-slate-500',
};

function normalizePrio(v?: string): string {
  const r = String(v ?? '').trim().toLowerCase();
  if (r === 'haute' || r === 'bloquant') return 'Bloquant';
  if (r === 'moyenne' || r === 'moyen' || r === 'critique') return 'Critique';
  return 'Normal';
}

// ── Composants ────────────────────────────────────────────────────────────────

function MetricCard({ title, value, subtitle, tone = 'text-primary', icon }: {
  title: string; value: string | number; subtitle?: string; tone?: string; icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ fontFamily: 'Sora, ui-sans-serif' }}>
      <div className="flex items-start justify-between">
        <p className="text-[11px] text-slate-500 uppercase tracking-[0.1em]">{title}</p>
        {icon && <span className="text-slate-300">{icon}</span>}
      </div>
      <p className={`mt-1 text-3xl font-semibold ${tone}`}>{value}</p>
      {subtitle && <p className="mt-1 text-xs leading-relaxed text-slate-400">{subtitle}</p>}
    </div>
  );
}

function MiniKpi({ label, value, tone = 'text-slate-700' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-2">
      <span className={`text-2xl font-bold ${tone}`}>{value}</span>
      <span className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{label}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-500">{children}</h2>;
}

function EmptyRow({ cols, msg }: { cols: number; msg: string }) {
  return (
    <tr><td colSpan={cols} className="py-8 text-center text-sm text-slate-400">{msg}</td></tr>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardUnifie() {
  const [indicateurs,  setIndicateurs]  = useState<Indicateurs | null>(null);
  const [maCharge,     setMaCharge]     = useState<MaCharge | null>(null);
  const [taches,       setTaches]       = useState<Tache[]>([]);
  const [occurrences,  setOccurrences]  = useState<Occurrence[]>([]);
  const [entites,      setEntites]      = useState<Entite[]>([]);
  const [loading,      setLoading]      = useState(true);

  // Filtres tâches
  const [ftStatut,   setFtStatut]   = useState('');
  const [ftPriorite, setFtPriorite] = useState('');
  const [ftEntiteId, setFtEntiteId] = useState('');

  // Filtres occurrences
  const [foStatut,   setFoStatut]   = useState('');
  const [foEntiteId, setFoEntiteId] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [indRes, chargeRes, tRes, oRes, entRes] = await Promise.all([
          fetch('/api/dashboard/indicateurs'),
          fetch('/api/dashboard/ma-charge'),
          fetch('/api/taches'),
          fetch('/api/occurrences'),
          fetch('/api/entites'),
        ]);
        const [indData, chargeData, tData, oData, entData] = await Promise.all([
          indRes.json(), chargeRes.json(), tRes.json(), oRes.json(), entRes.json(),
        ]);
        if (indData && !indData.error)    setIndicateurs(indData);
        if (chargeData && !chargeData.error) setMaCharge(chargeData);
        setTaches(Array.isArray(tData) ? tData : []);
        setOccurrences(Array.isArray(oData) ? oData : []);
        setEntites(Array.isArray(entData) ? entData : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const now = new Date();

  const filteredTaches = taches.filter(t => {
    if (ftStatut   && t.statut !== ftStatut) return false;
    if (ftPriorite && normalizePrio(t.priorite) !== ftPriorite) return false;
    if (ftEntiteId && t.assigneA?.entiteId !== ftEntiteId) return false;
    return true;
  });

  const filteredOccs = occurrences.filter(o => {
    if (foStatut   && o.statut !== foStatut) return false;
    if (foEntiteId && o.tacheOperationnelle.operation.entite?.id !== foEntiteId) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500"
        style={{ fontFamily: 'Sora, ui-sans-serif' }}>
        Chargement du tableau de bord…
      </div>
    );
  }

  return (
    <div className="space-y-8" style={{ fontFamily: 'Sora, ui-sans-serif' }}>

      {/* ── 1. Indicateurs globaux ─────────────────────────────────────── */}
      <section>
        <SectionTitle>Indicateurs globaux</SectionTitle>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <MetricCard
            title="Projets actifs"
            value={indicateurs?.projetsActifs ?? '—'}
            tone="text-primary"
            icon={<FolderOpen size={16} />}
          />
          <MetricCard
            title="Tâches en retard"
            value={indicateurs?.tachesEnRetard ?? '—'}
            tone={indicateurs?.tachesEnRetard ? 'text-orange-600' : 'text-slate-400'}
            icon={<AlertTriangle size={16} />}
          />
          <MetricCard
            title="Opérations actives"
            value={indicateurs?.operationsActives ?? '—'}
            tone="text-emerald-600"
            icon={<Repeat2 size={16} />}
          />
          <MetricCard
            title="Occ. en retard"
            value={indicateurs?.occsEnRetard ?? '—'}
            tone={indicateurs?.occsEnRetard ? 'text-red-600' : 'text-slate-400'}
            icon={<Clock size={16} />}
          />
          <MetricCard
            title="Occ. cette semaine"
            value={indicateurs?.occsSemaine ?? '—'}
            tone="text-blue-600"
            icon={<CalendarClock size={16} />}
          />
          <MetricCard
            title="Taux exéc. 30j"
            value={indicateurs?.tauxExecution30j != null ? `${indicateurs.tauxExecution30j}%` : '—'}
            subtitle={indicateurs ? `${indicateurs.occsRealisees30j} / ${indicateurs.occsTotal30j} réalisées` : undefined}
            tone={
              indicateurs?.tauxExecution30j == null ? 'text-slate-400'
              : indicateurs.tauxExecution30j >= 80   ? 'text-emerald-600'
              : indicateurs.tauxExecution30j >= 50   ? 'text-amber-600'
              : 'text-red-600'
            }
            icon={<CheckCircle2 size={16} />}
          />
        </div>
      </section>

      {/* ── 2. Ma charge ───────────────────────────────────────────────── */}
      {maCharge && (
        <section>
          <SectionTitle>Ma charge</SectionTitle>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

            {/* KPIs personnels */}
            <div className="flex flex-wrap items-center divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/60">
              <MiniKpi label="Tâches actives"  value={maCharge.kpis.tachesActives}      tone="text-primary" />
              <MiniKpi label="Tâches retard"   value={maCharge.kpis.tachesEnRetard}     tone={maCharge.kpis.tachesEnRetard   ? 'text-orange-600' : 'text-slate-400'} />
              <MiniKpi label="Occ. actives"    value={maCharge.kpis.occurrencesActives} tone="text-emerald-600" />
              <MiniKpi label="Occ. retard"     value={maCharge.kpis.occsEnRetard}       tone={maCharge.kpis.occsEnRetard     ? 'text-red-600'    : 'text-slate-400'} />
              <MiniKpi label="Occ. aujourd'hui" value={maCharge.kpis.occsAujourdhui}    tone={maCharge.kpis.occsAujourdhui   ? 'text-blue-600'   : 'text-slate-400'} />
            </div>

            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">

              {/* Mes tâches */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User size={14} className="text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-700">Mes tâches projet</h3>
                  <span className="text-xs text-slate-400">({maCharge.tachesProjet.length})</span>
                </div>
                {maCharge.tachesProjet.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">Aucune tâche active.</p>
                ) : (
                  <div className="space-y-2">
                    {maCharge.tachesProjet.map(t => {
                      const fin = t.dateFinPrevisionnelle ? new Date(t.dateFinPrevisionnelle) : null;
                      const enRetard = fin && fin < now;
                      return (
                        <div key={t.id} className={`flex items-start justify-between gap-2 rounded-xl p-2.5 border ${enRetard ? 'border-red-200 bg-red-50/40' : 'border-slate-100 bg-slate-50/50'}`}>
                          <div className="flex-1 min-w-0">
                            <Link href={t.projet ? `/projets/${t.projet.id}` : '#'}
                              className="text-sm font-medium text-slate-800 hover:text-primary hover:underline block truncate">
                              {t.libelle}
                            </Link>
                            {t.projet && (
                              <p className="text-xs text-slate-400 truncate mt-0.5">{t.projet.libelle}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${STATUT_TACHE_STYLE[t.statut] ?? 'bg-slate-100 text-slate-500'}`}>
                              {t.statut}
                            </span>
                            {fin && (
                              <span className={`text-[10px] font-medium ${enRetard ? 'text-red-600' : 'text-slate-400'}`}>
                                {enRetard && '⚠ '}{fin.toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mes occurrences */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarCheck size={14} className="text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-700">Mes occurrences</h3>
                  <span className="text-xs text-slate-400">({maCharge.occurrences.length})</span>
                </div>
                {maCharge.occurrences.length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">Aucune occurrence active.</p>
                ) : (
                  <div className="space-y-2">
                    {maCharge.occurrences.map(o => {
                      const ech = new Date(o.dateEcheance);
                      const enRetard = o.statut === 'En retard';
                      return (
                        <div key={o.id} className={`flex items-start justify-between gap-2 rounded-xl p-2.5 border ${enRetard ? 'border-red-200 bg-red-50/40' : 'border-slate-100 bg-slate-50/50'}`}>
                          <div className="flex-1 min-w-0">
                            <Link href={`/occurrences/${o.id}`}
                              className="text-sm font-medium text-slate-800 hover:text-primary hover:underline block truncate">
                              {o.tacheOperationnelle.libelle}
                            </Link>
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {o.tacheOperationnelle.operation.libelle}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${STATUT_OCC_STYLE[o.statut] ?? 'bg-slate-100 text-slate-500'}`}>
                              {o.statut}
                            </span>
                            <span className={`text-[10px] font-medium ${enRetard ? 'text-red-600' : 'text-slate-400'}`}>
                              {enRetard && '⚠ '}{ech.toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ── 3. Toutes les tâches projet ────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">
            Tâches projet
            <span className="ml-2 text-sm font-normal text-slate-400">({filteredTaches.length})</span>
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={ftStatut} onChange={e => setFtStatut(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none">
              <option value="">Tous statuts</option>
              {['À planifier', 'A faire', 'En cours', 'En attente', 'Terminé', 'Validé'].map(s =>
                <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={ftPriorite} onChange={e => setFtPriorite(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none">
              <option value="">Toutes priorités</option>
              {['Bloquant', 'Critique', 'Normal'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={ftEntiteId} onChange={e => setFtEntiteId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none">
              <option value="">Toutes entités</option>
              {entites.map(e => <option key={e.id} value={e.id}>{e.libelle}</option>)}
            </select>
            {(ftStatut || ftPriorite || ftEntiteId) && (
              <button type="button" onClick={() => { setFtStatut(''); setFtPriorite(''); setFtEntiteId(''); }}
                className="text-xs text-slate-400 underline hover:text-slate-600">Réinitialiser</button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Tâche</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Projet</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Assigné(e)</th>
                <th className="text-center px-4 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Priorité</th>
                <th className="text-center px-4 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Statut</th>
                <th className="text-right px-4 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Échéance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTaches.length === 0 ? (
                <EmptyRow cols={6} msg="Aucune tâche." />
              ) : filteredTaches.map(t => {
                const fin = t.dateFinPrevisionnelle ? new Date(t.dateFinPrevisionnelle) : null;
                const enRetard = fin && fin < now && t.statut !== 'Terminé' && t.statut !== 'Validé';
                const prio = normalizePrio(t.priorite);
                return (
                  <tr key={t.id} className={`hover:bg-slate-50/60 ${enRetard ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-2.5 font-medium text-slate-800 max-w-[240px] truncate">
                      {t.projet
                        ? <Link href={`/projets/${t.projet.id}`} className="hover:text-primary hover:underline">{t.libelle}</Link>
                        : t.libelle}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500 truncate max-w-[160px]">
                      {t.projet
                        ? <Link href={`/projets/${t.projet.id}`} className="hover:text-primary hover:underline">{t.projet.libelle}</Link>
                        : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">
                      {t.assigneA ? `${t.assigneA.prenoms} ${t.assigneA.nom}` : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-[11px] rounded-full px-2 py-0.5 ${PRIORITE_STYLE[prio] ?? 'bg-slate-100 text-slate-600'}`}>{prio}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-[11px] rounded-full px-2 py-0.5 ${STATUT_TACHE_STYLE[t.statut] ?? 'bg-slate-100 text-slate-600'}`}>{t.statut}</span>
                    </td>
                    <td className={`px-4 py-2.5 text-right text-xs font-medium ${enRetard ? 'text-red-600' : 'text-slate-500'}`}>
                      {fin ? fin.toLocaleDateString('fr-FR') : '—'}
                      {enRetard && <span className="ml-1">⚠</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 4. Toutes les occurrences ──────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">
            Occurrences opérationnelles
            <span className="ml-2 text-sm font-normal text-slate-400">({filteredOccs.length})</span>
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={foStatut} onChange={e => setFoStatut(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none">
              <option value="">Tous statuts</option>
              {['En attente', 'En cours', 'En retard', 'Réalisée', 'Réalisée en retard', 'Annulée'].map(s =>
                <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={foEntiteId} onChange={e => setFoEntiteId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none">
              <option value="">Toutes entités</option>
              {entites.map(e => <option key={e.id} value={e.id}>{e.libelle}</option>)}
            </select>
            {(foStatut || foEntiteId) && (
              <button type="button" onClick={() => { setFoStatut(''); setFoEntiteId(''); }}
                className="text-xs text-slate-400 underline hover:text-slate-600">Réinitialiser</button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Tâche opérationnelle</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Opération</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Entité</th>
                <th className="text-center px-4 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Statut</th>
                <th className="text-right px-4 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Échéance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOccs.length === 0 ? (
                <EmptyRow cols={5} msg="Aucune occurrence." />
              ) : filteredOccs.map(o => {
                const ech = new Date(o.dateEcheance);
                const enRetard = o.statut === 'En retard';
                return (
                  <tr key={o.id} className={`hover:bg-slate-50/60 ${enRetard ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-2.5 font-medium text-slate-800 max-w-[200px] truncate">
                      <Link href={`/occurrences/${o.id}`} className="hover:text-primary hover:underline">
                        {o.tacheOperationnelle.libelle}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500 truncate max-w-[160px]">
                      <Link href={`/operations/${o.tacheOperationnelle.operation.id}`}
                        className="hover:text-primary hover:underline">
                        {o.tacheOperationnelle.operation.libelle}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">
                      {o.tacheOperationnelle.operation.entite?.libelle ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-[11px] rounded-full px-2 py-0.5 ${STATUT_OCC_STYLE[o.statut] ?? 'bg-slate-100 text-slate-600'}`}>
                        {o.statut}
                        {o.retardJours != null && o.retardJours > 0 && ` (+${o.retardJours}j)`}
                      </span>
                    </td>
                    <td className={`px-4 py-2.5 text-right text-xs font-medium ${enRetard ? 'text-red-600' : 'text-slate-500'}`}>
                      {ech.toLocaleDateString('fr-FR')}
                      {enRetard && <span className="ml-1">⚠</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
