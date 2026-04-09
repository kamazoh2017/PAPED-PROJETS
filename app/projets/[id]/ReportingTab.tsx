'use client';

import { useMemo, useState } from 'react';
import {
  CheckCircle2, Clock, AlertTriangle, TrendingUp, TrendingDown,
  Users, Building2, BarChart2, Target, Award, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Entite {
  id: string;
  libelle: string;
  tutelle?: string;
}

interface Personne {
  id: string;
  nom: string;
  prenoms: string;
  fonction: string;
  email: string;
  entite: Entite;
}

interface Tache {
  id: string;
  libelle: string;
  priorite: string;
  statut: string;
  dateDebutPrevisionnelle?: string;
  dateFinPrevisionnelle?: string;
  dateDebutEffective?: string;
  dateFinEffective?: string;
  assigneAId?: string;
  assigneA?: Personne;
}

interface Projet {
  id: string;
  libelle: string;
  chefProjet: Personne;
  equipeProjet: Personne[];
  taches: Tache[];
  risques?: { libelle: string; taux: number; gravite: string; couleur: string }[];
}

interface Props {
  projet: Projet;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isTerminee(statut: string) {
  return statut === 'Terminé' || statut === 'Validé';
}

function isEnCours(statut: string) {
  return statut === 'En cours' || statut === 'En attente';
}

function isNonDemarree(statut: string) {
  return statut === 'À planifier' || statut === 'A faire';
}

function isEnRetard(t: Tache): boolean {
  if (isTerminee(t.statut)) return false;
  const fin = t.dateFinPrevisionnelle ? new Date(t.dateFinPrevisionnelle).getTime() : null;
  return fin !== null && fin < Date.now();
}

function joursRetard(t: Tache): number {
  const fin = t.dateFinPrevisionnelle ? new Date(t.dateFinPrevisionnelle).getTime() : null;
  if (!fin) return 0;
  return Math.max(0, Math.floor((Date.now() - fin) / 86400000));
}

function getPerformanceLabel(taux: number, enRetard: number, total: number): {
  label: string; classes: string; icon: React.ElementType;
} {
  if (total === 0) return { label: 'Non assigné', classes: 'bg-slate-100 text-slate-500', icon: Clock };
  const tauxRetard = total > 0 ? enRetard / total : 0;
  if (taux >= 0.8 && tauxRetard === 0) return { label: 'Excellent', classes: 'bg-green-100 text-green-700', icon: Award };
  if (taux >= 0.6 && tauxRetard <= 0.1) return { label: 'Bon', classes: 'bg-blue-100 text-blue-700', icon: TrendingUp };
  if (taux >= 0.4 || tauxRetard <= 0.25) return { label: 'À surveiller', classes: 'bg-amber-100 text-amber-700', icon: AlertCircle };
  return { label: 'En difficulté', classes: 'bg-red-100 text-red-700', icon: TrendingDown };
}

function pct(val: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((val / total) * 100)}%`;
}

function normalizePriorite(p?: string): string {
  const raw = (p ?? '').trim().toLowerCase();
  if (raw === 'bloquant' || raw === 'haute') return 'Critique';
  if (raw === 'critique') return 'Critique';
  if (raw === 'normale' || raw === 'normal' || raw === 'moyenne' || raw === 'moyen') return 'Normale';
  if (raw === 'basse' || raw === 'faible') return 'Basse';
  return p ?? '—';
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, color, Icon,
}: { label: string; value: string | number; sub?: string; color: string; Icon: React.ElementType }) {
  return (
    <div className={`rounded-2xl border ${color} px-5 py-4 flex items-start gap-3`}>
      <div className="mt-0.5 p-2 rounded-xl bg-white/60">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium opacity-70 truncate">{label}</p>
        <p className="text-2xl font-bold leading-tight">{value}</p>
        {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color = 'bg-secondary' }: { value: number; max: number; color?: string }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${w}%` }} />
    </div>
  );
}

// ─── SortButton — défini hors du composant pour éviter le remontage à chaque render ──
function SortButton({
  value, current, onChange, label,
}: { value: string; current: string; onChange: (v: any) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
        current === value
          ? 'bg-primary text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ReportingTab({ projet }: Props) {
  const [expandedResource, setExpandedResource] = useState<string | null>(null);
  const [expandedEntite, setExpandedEntite] = useState<string | null>(null);
  const [sortRessource, setSortRessource] = useState<'taux' | 'retard' | 'total'>('taux');
  const [sortEntite, setSortEntite] = useState<'taux' | 'retard' | 'total'>('taux');

  const taches = projet.taches ?? [];

  // ── Calculs globaux ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = taches.length;
    const terminees = taches.filter(t => isTerminee(t.statut)).length;
    const enCours = taches.filter(t => isEnCours(t.statut)).length;
    const nonDemarrees = taches.filter(t => isNonDemarree(t.statut)).length;
    const enRetard = taches.filter(isEnRetard).length;
    const tauxExecution = total > 0 ? Math.round((terminees / total) * 100) : 0;

    const parStatut: Record<string, number> = {};
    taches.forEach(t => { parStatut[t.statut] = (parStatut[t.statut] ?? 0) + 1; });

    const parPriorite: Record<string, { total: number; terminees: number; enCours: number; enRetard: number }> = {};
    taches.forEach(t => {
      const p = normalizePriorite(t.priorite);
      if (!parPriorite[p]) parPriorite[p] = { total: 0, terminees: 0, enCours: 0, enRetard: 0 };
      parPriorite[p].total++;
      if (isTerminee(t.statut)) parPriorite[p].terminees++;
      else if (isEnCours(t.statut)) parPriorite[p].enCours++;
      if (isEnRetard(t)) parPriorite[p].enRetard++;
    });

    const tachesEnRetard = taches
      .filter(isEnRetard)
      .map(t => ({ ...t, jours: joursRetard(t) }))
      .sort((a, b) => b.jours - a.jours);

    return { total, terminees, enCours, nonDemarrees, enRetard, tauxExecution, parStatut, parPriorite, tachesEnRetard };
  }, [taches]);

  // ── Stats par ressource ──────────────────────────────────────────────────
  const statsRessource = useMemo(() => {
    const map = new Map<string, {
      personne: Personne;
      total: number; terminees: number; enCours: number; enRetard: number; nonDemarrees: number;
      taches: Tache[];
    }>();

    // Initialiser avec toutes les personnes de l'équipe + chef projet
    const membres = [...projet.equipeProjet];
    if (!membres.find(m => m.id === projet.chefProjet.id)) membres.unshift(projet.chefProjet);

    membres.forEach(p => {
      if (!map.has(p.id)) {
        map.set(p.id, { personne: p, total: 0, terminees: 0, enCours: 0, enRetard: 0, nonDemarrees: 0, taches: [] });
      }
    });

    taches.forEach(t => {
      if (!t.assigneA) return;
      if (!map.has(t.assigneA.id)) {
        map.set(t.assigneA.id, { personne: t.assigneA, total: 0, terminees: 0, enCours: 0, enRetard: 0, nonDemarrees: 0, taches: [] });
      }
      const s = map.get(t.assigneA.id)!;
      s.total++;
      s.taches.push(t);
      if (isTerminee(t.statut)) s.terminees++;
      else if (isEnCours(t.statut)) s.enCours++;
      else if (isNonDemarree(t.statut)) s.nonDemarrees++;
      if (isEnRetard(t)) s.enRetard++;
    });

    let arr = [...map.values()];
    if (sortRessource === 'taux') arr.sort((a, b) => (b.total > 0 ? b.terminees / b.total : -1) - (a.total > 0 ? a.terminees / a.total : -1));
    if (sortRessource === 'retard') arr.sort((a, b) => b.enRetard - a.enRetard);
    if (sortRessource === 'total') arr.sort((a, b) => b.total - a.total);
    return arr;
  }, [taches, projet.equipeProjet, projet.chefProjet, sortRessource]);

  // ── Stats par entité ─────────────────────────────────────────────────────
  const statsEntite = useMemo(() => {
    const map = new Map<string, {
      entite: Entite;
      membres: Set<string>;
      total: number; terminees: number; enCours: number; enRetard: number; nonDemarrees: number;
      taches: Tache[];
    }>();

    taches.forEach(t => {
      if (!t.assigneA) return;
      const e = t.assigneA.entite;
      if (!map.has(e.id)) {
        map.set(e.id, { entite: e, membres: new Set(), total: 0, terminees: 0, enCours: 0, enRetard: 0, nonDemarrees: 0, taches: [] });
      }
      const s = map.get(e.id)!;
      s.membres.add(t.assigneA.id);
      s.total++;
      s.taches.push(t);
      if (isTerminee(t.statut)) s.terminees++;
      else if (isEnCours(t.statut)) s.enCours++;
      else if (isNonDemarree(t.statut)) s.nonDemarrees++;
      if (isEnRetard(t)) s.enRetard++;
    });

    let arr = [...map.values()];
    if (sortEntite === 'taux') arr.sort((a, b) => (b.total > 0 ? b.terminees / b.total : -1) - (a.total > 0 ? a.terminees / a.total : -1));
    if (sortEntite === 'retard') arr.sort((a, b) => b.enRetard - a.enRetard);
    if (sortEntite === 'total') arr.sort((a, b) => b.total - a.total);
    return arr;
  }, [taches, sortEntite]);

  const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    'À planifier': { label: 'À planifier', color: 'text-slate-600', bg: 'bg-slate-100' },
    'A faire':     { label: 'À faire',     color: 'text-blue-600',  bg: 'bg-blue-100' },
    'En cours':    { label: 'En cours',    color: 'text-amber-600', bg: 'bg-amber-100' },
    'En attente':  { label: 'En attente',  color: 'text-purple-600', bg: 'bg-purple-100' },
    'Terminé':     { label: 'Terminé',     color: 'text-green-700', bg: 'bg-green-100' },
    'Validé':      { label: 'Validé',      color: 'text-teal-700',  bg: 'bg-teal-100' },
    'Archivée':    { label: 'Archivée',    color: 'text-slate-400', bg: 'bg-slate-50' },
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — DASHBOARD MACRO
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <BarChart2 size={18} className="text-primary" />
          <h2 className="text-lg font-bold text-primary">Dashboard macro</h2>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCard label="Total tâches"      value={stats.total}         color="border-slate-200 bg-slate-50 text-slate-700"    Icon={CheckCircle2} />
          <KpiCard label="Terminées / Validées" value={stats.terminees}  sub={pct(stats.terminees, stats.total)} color="border-green-200 bg-green-50 text-green-700"   Icon={CheckCircle2} />
          <KpiCard label="En cours"          value={stats.enCours}       sub={pct(stats.enCours, stats.total)}   color="border-amber-200 bg-amber-50 text-amber-700"   Icon={Clock} />
          <KpiCard label="Non démarrées"     value={stats.nonDemarrees}  sub={pct(stats.nonDemarrees, stats.total)} color="border-blue-200 bg-blue-50 text-blue-700" Icon={Target} />
          <KpiCard label="En retard"         value={stats.enRetard}      sub={pct(stats.enRetard, stats.total)}  color={stats.enRetard > 0 ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-700"} Icon={AlertTriangle} />
          <KpiCard label="Taux d'exécution"  value={`${stats.tauxExecution}%`} sub="tâches terminées / total" color={stats.tauxExecution >= 75 ? "border-green-200 bg-green-50 text-green-700" : stats.tauxExecution >= 40 ? "border-amber-200 bg-amber-50 text-amber-700" : "border-red-200 bg-red-50 text-red-700"} Icon={TrendingUp} />
        </div>

        {/* Tâches en retard */}
        {stats.tachesEnRetard.length > 0 && (
          <div className="bg-white rounded-2xl border border-red-200 p-5">
            <h3 className="text-sm font-semibold text-red-700 mb-4 flex items-center gap-2">
              <AlertTriangle size={15} />
              Tâches en retard ({stats.tachesEnRetard.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100">
                    <th className="text-left pb-2 font-medium">Tâche</th>
                    <th className="text-left pb-2 font-medium">Responsable</th>
                    <th className="text-left pb-2 font-medium">Entité</th>
                    <th className="text-center pb-2 font-medium">Fin prévue</th>
                    <th className="text-center pb-2 font-medium text-red-600">Retard</th>
                    <th className="text-center pb-2 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.tachesEnRetard.map(t => {
                    const cfg = STATUT_CONFIG[t.statut] ?? { label: t.statut, color: 'text-slate-600', bg: 'bg-slate-100' };
                    return (
                      <tr key={t.id} className="hover:bg-red-50/30 transition-colors">
                        <td className="py-2 font-medium text-slate-700 max-w-[200px] truncate">{t.libelle}</td>
                        <td className="py-2 text-slate-600">
                          {t.assigneA ? `${t.assigneA.prenoms} ${t.assigneA.nom}` : <span className="text-slate-400 italic">Non assigné</span>}
                        </td>
                        <td className="py-2 text-slate-500">{t.assigneA?.entite?.libelle ?? '—'}</td>
                        <td className="py-2 text-center text-slate-500">{fmtDate(t.dateFinPrevisionnelle)}</td>
                        <td className="py-2 text-center">
                          <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            {t.jours}j
                          </span>
                        </td>
                        <td className="py-2 text-center">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — REPORTING PAR RESSOURCE
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-primary">Reporting par ressource</h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Trier par :</span>
            <SortButton value="taux"   current={sortRessource} onChange={setSortRessource} label="Taux exécution" />
            <SortButton value="retard" current={sortRessource} onChange={setSortRessource} label="Retards" />
            <SortButton value="total"  current={sortRessource} onChange={setSortRessource} label="Charge" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Ressource</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 hidden md:table-cell">Entité</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500">Total</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-green-600">Terminées</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-amber-600">En cours</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-red-600">Retard</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Taux exec.</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">Perf.</th>
                <th className="px-3 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {statsRessource.map(({ personne, total, terminees, enCours, enRetard, taches: tachesP }) => {
                const taux = total > 0 ? terminees / total : 0;
                const perf = getPerformanceLabel(taux, enRetard, total);
                const PerfIcon = perf.icon;
                const isExpanded = expandedResource === personne.id;
                const isChef = personne.id === projet.chefProjet.id;

                return [
                  <tr
                    key={personne.id}
                    className={`hover:bg-slate-50 transition-colors ${isChef ? 'bg-primary/[0.02]' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {personne.prenoms[0]}{personne.nom[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-xs leading-tight">
                            {personne.prenoms} {personne.nom}
                            {isChef && <span className="ml-1.5 text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">Chef de projet</span>}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{personne.fonction}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{personne.entite?.libelle ?? '—'}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-bold text-slate-700">{total}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-semibold ${terminees > 0 ? 'text-green-700' : 'text-slate-400'}`}>{terminees}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-semibold ${enCours > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{enCours}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-semibold ${enRetard > 0 ? 'text-red-600' : 'text-slate-400'}`}>{enRetard}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar
                          value={terminees}
                          max={total}
                          color={taux >= 0.75 ? 'bg-green-500' : taux >= 0.4 ? 'bg-amber-400' : 'bg-red-400'}
                        />
                        <span className="text-xs font-bold min-w-[36px] text-right text-slate-700">{pct(terminees, total)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${perf.classes}`}>
                        <PerfIcon size={10} />
                        {perf.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {total > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedResource(isExpanded ? null : personne.id)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                    </td>
                  </tr>,
                  isExpanded && (
                    <tr key={`${personne.id}-detail`} className="bg-slate-50/80">
                      <td colSpan={9} className="px-6 py-3">
                        <p className="text-xs font-semibold text-slate-500 mb-2">Tâches assignées à {personne.prenoms} {personne.nom}</p>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-slate-400 border-b border-slate-200">
                              <th className="text-left pb-1.5 font-medium">Tâche</th>
                              <th className="text-center pb-1.5 font-medium">Statut</th>
                              <th className="text-center pb-1.5 font-medium">Priorité</th>
                              <th className="text-center pb-1.5 font-medium">Fin prévue</th>
                              <th className="text-center pb-1.5 font-medium text-red-600">Retard</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {tachesP
                              .slice()
                              .sort((a, b) => (isEnRetard(b) ? 1 : 0) - (isEnRetard(a) ? 1 : 0))
                              .map(t => {
                                const cfg = STATUT_CONFIG[t.statut] ?? { label: t.statut, color: 'text-slate-600', bg: 'bg-slate-100' };
                                const jr = joursRetard(t);
                                return (
                                  <tr key={t.id} className={isEnRetard(t) ? 'bg-red-50/40' : ''}>
                                    <td className="py-1.5 font-medium text-slate-700 max-w-[220px] truncate">{t.libelle}</td>
                                    <td className="py-1.5 text-center">
                                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                                    </td>
                                    <td className="py-1.5 text-center text-slate-500">{normalizePriorite(t.priorite)}</td>
                                    <td className="py-1.5 text-center text-slate-500">{fmtDate(t.dateFinPrevisionnelle)}</td>
                                    <td className="py-1.5 text-center">
                                      {jr > 0 ? (
                                        <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">{jr}j</span>
                                      ) : <span className="text-slate-300">—</span>}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>

          {/* Résumé équipe */}
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 flex flex-wrap gap-4 text-xs text-slate-500">
            <span>{statsRessource.filter(r => r.total > 0).length} membre(s) avec des tâches assignées</span>
            <span className="text-green-700 font-semibold">
              {statsRessource.filter(r => getPerformanceLabel(r.total > 0 ? r.terminees / r.total : 0, r.enRetard, r.total).label === 'Excellent').length} Excellent
            </span>
            <span className="text-blue-700 font-semibold">
              {statsRessource.filter(r => getPerformanceLabel(r.total > 0 ? r.terminees / r.total : 0, r.enRetard, r.total).label === 'Bon').length} Bon
            </span>
            <span className="text-amber-700 font-semibold">
              {statsRessource.filter(r => getPerformanceLabel(r.total > 0 ? r.terminees / r.total : 0, r.enRetard, r.total).label === 'À surveiller').length} À surveiller
            </span>
            <span className="text-red-700 font-semibold">
              {statsRessource.filter(r => getPerformanceLabel(r.total > 0 ? r.terminees / r.total : 0, r.enRetard, r.total).label === 'En difficulté').length} En difficulté
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — REPORTING PAR ENTITÉ
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-primary">Reporting par entité</h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Trier par :</span>
            <SortButton value="taux"   current={sortEntite} onChange={setSortEntite} label="Taux exécution" />
            <SortButton value="retard" current={sortEntite} onChange={setSortEntite} label="Retards" />
            <SortButton value="total"  current={sortEntite} onChange={setSortEntite} label="Charge" />
          </div>
        </div>

        {statsEntite.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
            Aucune tâche assignée — impossible de calculer les stats par entité.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Entité</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500">Membres</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500">Total</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-green-600">Terminées</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-amber-600">En cours</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-blue-600">Non démarrées</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-red-600">Retard</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Taux exec.</th>
                  <th className="px-3 py-3 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statsEntite.map(({ entite, membres, total, terminees, enCours, enRetard, nonDemarrees, taches: tachesE }) => {
                  const taux = total > 0 ? terminees / total : 0;
                  const isExpanded = expandedEntite === entite.id;

                  // membres de l'entité avec leurs stats
                  const membresStats = (() => {
                    const m = new Map<string, { personne: Personne; total: number; terminees: number; enRetard: number }>();
                    tachesE.forEach(t => {
                      if (!t.assigneA) return;
                      const pid = t.assigneA.id;
                      if (!m.has(pid)) m.set(pid, { personne: t.assigneA, total: 0, terminees: 0, enRetard: 0 });
                      const s = m.get(pid)!;
                      s.total++;
                      if (isTerminee(t.statut)) s.terminees++;
                      if (isEnRetard(t)) s.enRetard++;
                    });
                    return [...m.values()].sort((a, b) => b.total - a.total);
                  })();

                  return [
                    <tr key={entite.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">
                            <Building2 size={13} />
                          </div>
                          <p className="font-semibold text-slate-800 text-xs">{entite.libelle}</p>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                          {membres.size}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-slate-700">{total}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`font-semibold ${terminees > 0 ? 'text-green-700' : 'text-slate-400'}`}>{terminees}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`font-semibold ${enCours > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{enCours}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`font-semibold ${nonDemarrees > 0 ? 'text-blue-600' : 'text-slate-400'}`}>{nonDemarrees}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`font-semibold ${enRetard > 0 ? 'text-red-600' : 'text-slate-400'}`}>{enRetard}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar
                            value={terminees}
                            max={total}
                            color={taux >= 0.75 ? 'bg-green-500' : taux >= 0.4 ? 'bg-amber-400' : 'bg-red-400'}
                          />
                          <span className="text-xs font-bold min-w-[36px] text-right text-slate-700">{pct(terminees, total)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => setExpandedEntite(isExpanded ? null : entite.id)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                    </tr>,
                    isExpanded && (
                      <tr key={`${entite.id}-detail`} className="bg-slate-50/80">
                        <td colSpan={9} className="px-6 py-3">
                          <p className="text-xs font-semibold text-slate-500 mb-2">Membres de {entite.libelle}</p>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-slate-400 border-b border-slate-200">
                                <th className="text-left pb-1.5 font-medium">Personne</th>
                                <th className="text-center pb-1.5 font-medium">Total</th>
                                <th className="text-center pb-1.5 font-medium text-green-600">Terminées</th>
                                <th className="text-center pb-1.5 font-medium text-red-600">Retard</th>
                                <th className="text-left pb-1.5 font-medium">Taux</th>
                                <th className="text-center pb-1.5 font-medium">Perf.</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {membresStats.map(ms => {
                                const t2 = ms.total > 0 ? ms.terminees / ms.total : 0;
                                const p2 = getPerformanceLabel(t2, ms.enRetard, ms.total);
                                const PI = p2.icon;
                                return (
                                  <tr key={ms.personne.id}>
                                    <td className="py-1.5 font-medium text-slate-700">
                                      {ms.personne.prenoms} {ms.personne.nom}
                                    </td>
                                    <td className="py-1.5 text-center font-bold text-slate-700">{ms.total}</td>
                                    <td className="py-1.5 text-center text-green-700">{ms.terminees}</td>
                                    <td className={`py-1.5 text-center font-semibold ${ms.enRetard > 0 ? 'text-red-600' : 'text-slate-400'}`}>{ms.enRetard}</td>
                                    <td className="py-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <ProgressBar value={ms.terminees} max={ms.total} color={t2 >= 0.75 ? 'bg-green-500' : t2 >= 0.4 ? 'bg-amber-400' : 'bg-red-400'} />
                                        <span className="font-bold text-slate-700 min-w-[36px]">{pct(ms.terminees, ms.total)}</span>
                                      </div>
                                    </td>
                                    <td className="py-1.5 text-center">
                                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${p2.classes}`}>
                                        <PI size={9} />{p2.label}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
