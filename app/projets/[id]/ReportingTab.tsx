'use client';

import { useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
} from 'recharts';
import {
  TrendingUp, TrendingDown,
  Users, Building2, BarChart2, Award, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Entite { id: string; libelle: string; tutelle?: string; }

interface Personne {
  id: string; nom: string; prenoms: string; fonction: string; email: string; entite: Entite;
}

interface Tache {
  id: string;
  libelle: string;
  priorite: string;
  statut: string;
  etatAvancement?: string;
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

interface Props { projet: Projet; }

// ─── Constantes ──────────────────────────────────────────────────────────────

const STATUTS_TACHES = ['À planifier', 'A faire', 'En cours', 'En attente', 'Terminé', 'Validé'];

const STATUT_TACHE_COLOR: Record<string, string> = {
  'À planifier': '#94a3b8',
  'A faire':     '#3b82f6',
  'En cours':    '#f59e0b',
  'En attente':  '#ef4444',
  'Terminé':     '#22c55e',
  'Validé':      '#10b981',
};

const ETATS_AV = [
  { key: 'en-avance',  label: 'En avance',  color: '#22c55e' },
  { key: 'a-lheure',   label: "À l'heure",  color: '#3b82f6' },
  { key: 'retard',     label: 'En retard',  color: '#f97316' },
  { key: 'hors-delai', label: 'Hors délai', color: '#ef4444' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isTerminee(statut: string)   { return statut === 'Terminé' || statut === 'Validé'; }
function isEnCours(statut: string)    { return statut === 'En cours' || statut === 'En attente'; }
function isNonDemarree(statut: string){ return statut === 'À planifier' || statut === 'A faire'; }

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

/** Identique à normalizePriority du dashboard tâches */
function normalizePriority(value?: string): 'Bloquant' | 'Critique' | 'Normal' {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'haute' || raw === 'bloquant') return 'Bloquant';
  if (raw === 'moyenne' || raw === 'moyen' || raw === 'critique') return 'Critique';
  if (raw === 'basse' || raw === 'faible' || raw === 'normal') return 'Normal';
  return 'Critique';
}

/** Pour l'affichage dans les tableaux ressources/entités */
function normalizePriorite(p?: string): string {
  const raw = (p ?? '').trim().toLowerCase();
  if (raw === 'bloquant' || raw === 'haute') return 'Critique';
  if (raw === 'critique') return 'Critique';
  if (raw === 'normale' || raw === 'normal' || raw === 'moyenne' || raw === 'moyen') return 'Normale';
  if (raw === 'basse' || raw === 'faible') return 'Basse';
  return p ?? '—';
}

/** Calcule l'état d'avancement si non fourni par l'API */
function computeEtatAv(t: Tache): string {
  if (t.etatAvancement) return t.etatAvancement;
  const isDone = isTerminee(t.statut);
  const now = Date.now();
  const fin   = t.dateFinPrevisionnelle   ? new Date(t.dateFinPrevisionnelle).getTime()   : null;
  const debut = t.dateDebutPrevisionnelle ? new Date(t.dateDebutPrevisionnelle).getTime() : null;
  if (!isDone && fin && fin <= now)   return 'hors-delai';
  if (isDone)                          return 'en-avance';
  if (debut && debut <= now)           return 'retard';
  return 'a-lheure';
}

function safePct(v: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((v / total) * 100);
}

function getPerformanceLabel(taux: number, enRetard: number, total: number): {
  label: string; classes: string; icon: React.ElementType;
} {
  if (total === 0) return { label: 'Non assigné', classes: 'bg-slate-100 text-slate-500', icon: AlertCircle };
  const tauxRetard = total > 0 ? enRetard / total : 0;
  if (taux >= 0.8 && tauxRetard === 0)  return { label: 'Excellent',    classes: 'bg-green-100 text-green-700', icon: Award };
  if (taux >= 0.6 && tauxRetard <= 0.1) return { label: 'Bon',          classes: 'bg-blue-100 text-blue-700',  icon: TrendingUp };
  if (taux >= 0.4 || tauxRetard <= 0.25)return { label: 'À surveiller', classes: 'bg-amber-100 text-amber-700',icon: AlertCircle };
  return { label: 'En difficulté', classes: 'bg-red-100 text-red-700', icon: TrendingDown };
}

function pct(val: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((val / total) * 100)}%`;
}

// ─── MetricCard — même style que /projets/tableau-de-bord ────────────────────

function MetricCard({
  title, value, rightValue, tone = 'text-primary',
}: { title: string; value: string | number; rightValue?: string; tone?: string }) {
  return (
    <div
      className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3 transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ fontFamily: 'Sora, ui-sans-serif' }}
    >
      <p className="text-slate-500 uppercase tracking-[0.1em] text-[10px]">{title}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className={`font-semibold text-xl ${tone}`}>{value}</p>
        {rightValue && <span className="font-medium text-slate-500 text-xs">{rightValue}</span>}
      </div>
    </div>
  );
}

// ─── RiskCard ─────────────────────────────────────────────────────────────────

type RiskLevel = 'Faible' | 'Modéré' | 'Élevé' | 'Critique';

function getRiskLevel(score: number, thresholds: [number, number, number] = [15, 30, 50]): RiskLevel {
  if (score < thresholds[0]) return 'Faible';
  if (score < thresholds[1]) return 'Modéré';
  if (score < thresholds[2]) return 'Élevé';
  return 'Critique';
}

const RISK_STYLE: Record<RiskLevel, { bar: string; badge: string; border: string; value: string }> = {
  Faible:   { bar: 'bg-green-400',  badge: 'bg-green-100 text-green-700',   border: 'border-green-200',  value: 'text-green-700'  },
  Modéré:   { bar: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-700',   border: 'border-amber-200',  value: 'text-amber-700'  },
  Élevé:    { bar: 'bg-orange-400', badge: 'bg-orange-100 text-orange-700', border: 'border-orange-200', value: 'text-orange-700' },
  Critique: { bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700',       border: 'border-red-200',    value: 'text-red-700'    },
};

function RiskCard({ label, score, thresholds }: { label: string; score: number; thresholds?: [number, number, number] }) {
  const level  = getRiskLevel(score, thresholds);
  const style  = RISK_STYLE[level];
  return (
    <div className={`rounded-2xl border ${style.border} bg-white shadow-sm p-3 flex flex-col gap-2`}
      style={{ fontFamily: 'Sora, ui-sans-serif' }}>
      <p className="text-slate-500 uppercase tracking-[0.09em] text-[10px] leading-tight">{label}</p>
      <div className="flex items-end justify-between gap-1">
        <p className={`font-bold text-2xl leading-none ${style.value}`}>{score}%</p>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>{level}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full transition-all ${style.bar}`} style={{ width: `${Math.min(score, 100)}%` }} />
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

// ─── SortButton — défini hors du composant pour éviter le remontage ──────────
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
  const [expandedEntite,   setExpandedEntite]   = useState<string | null>(null);
  const [sortRessource, setSortRessource] = useState<'taux' | 'retard' | 'total'>('taux');
  const [sortEntite,    setSortEntite]    = useState<'taux' | 'retard' | 'total'>('taux');

  const taches = projet.taches ?? [];
  const nowTs  = Date.now();

  // ── KPIs (identiques au dashboard tâches) ───────────────────────────────────
  const kpi = useMemo(() => {
    const total              = taches.length;
    const enCours            = taches.filter(t => t.statut === 'En cours').length;
    const enAttente          = taches.filter(t => t.statut === 'En attente').length;
    const aFaire             = taches.filter(t => t.statut === 'A faire' || t.statut === 'À faire').length;
    const terminees          = taches.filter(t => t.statut === 'Terminé').length;
    const validees           = taches.filter(t => t.statut === 'Validé').length;
    const achevement         = safePct(terminees + validees, total);
    const nonAssignees       = taches.filter(t => !t.assigneA).length;
    const bloquantes         = taches.filter(t => normalizePriority(t.priorite) === 'Bloquant').length;
    const enRetardCount      = taches.filter(t => {
      const fin = t.dateFinPrevisionnelle ? new Date(t.dateFinPrevisionnelle).getTime() : null;
      return fin !== null && nowTs > fin && !isTerminee(t.statut);
    }).length;

    // ── Scores de risque (0-100) ──
    const retardEtatCount   = taches.filter(t => computeEtatAv(t) === 'retard').length;
    const horsDelaiCount    = taches.filter(t => computeEtatAv(t) === 'hors-delai').length;
    const nonDemarreesCount = taches.filter(t => isNonDemarree(t.statut)).length;

    const risqueRetard      = safePct(retardEtatCount,   total);
    const risqueHorsDelai   = safePct(horsDelaiCount,    total);
    const risqueFaibleProg  = safePct(nonDemarreesCount, total);
    const risqueSuspension  = safePct(enAttente,         total);
    // Risque global = moyenne pondérée (hors-délai × 2, suspension × 1.5, retard × 1, faible prog × 0.5)
    const risqueGlobal = total === 0 ? 0 : Math.min(100, Math.round(
      (risqueHorsDelai * 2 + risqueSuspension * 1.5 + risqueRetard * 1 + risqueFaibleProg * 0.5) / 5
    ));

    return { total, enCours, enAttente, aFaire, terminees, validees, achevement, nonAssignees, bloquantes, enRetardCount,
             risqueRetard, risqueHorsDelai, risqueFaibleProg, risqueSuspension, risqueGlobal };
  }, [taches, nowTs]);

  // ── Données graphiques ───────────────────────────────────────────────────────
  const taskStatusPieData = useMemo(() =>
    STATUTS_TACHES
      .map(s => ({
        name:  s === 'A faire' ? 'À faire' : s,
        value: taches.filter(t => t.statut === s || (s === 'A faire' && t.statut === 'À faire')).length,
        color: STATUT_TACHE_COLOR[s] ?? '#94a3b8',
      }))
      .filter(d => d.value > 0),
  [taches]);

  const taskPrioriteData = useMemo(() => [
    { name: 'Bloquant', value: taches.filter(t => normalizePriority(t.priorite) === 'Bloquant').length, color: '#ef4444' },
    { name: 'Critique', value: taches.filter(t => normalizePriority(t.priorite) === 'Critique').length, color: '#f59e0b' },
    { name: 'Normal',   value: taches.filter(t => normalizePriority(t.priorite) === 'Normal').length,   color: '#22c55e' },
  ].filter(d => d.value > 0), [taches]);

  const tachesParEtatAvancement = useMemo(() =>
    ETATS_AV.map(e => ({
      name:  e.label,
      value: taches.filter(t => computeEtatAv(t) === e.key).length,
      color: e.color,
    })).filter(d => d.value > 0),
  [taches]);

  const PRIO_LIST = ['Bloquant', 'Critique', 'Normal'];

  const statutParPriorite = useMemo(() =>
    PRIO_LIST.map(prio => {
      const ts = taches.filter(t => normalizePriority(t.priorite) === prio);
      const entry: Record<string, string | number> = { name: prio };
      STATUTS_TACHES.forEach(s => {
        entry[s === 'A faire' ? 'À faire' : s] = ts.filter(t => t.statut === s || (s === 'A faire' && t.statut === 'À faire')).length;
      });
      return entry;
    }),
  [taches]);

  const avancementParPriorite = useMemo(() =>
    PRIO_LIST.map(prio => {
      const ts = taches.filter(t => normalizePriority(t.priorite) === prio);
      return {
        name:          prio,
        'En avance':   ts.filter(t => computeEtatAv(t) === 'en-avance').length,
        "À l'heure":   ts.filter(t => computeEtatAv(t) === 'a-lheure').length,
        'En retard':   ts.filter(t => computeEtatAv(t) === 'retard').length,
        'Hors délai':  ts.filter(t => computeEtatAv(t) === 'hors-delai').length,
      };
    }),
  [taches]);

  const statutParEtatAvancement = useMemo(() =>
    ETATS_AV.map(e => {
      const ts = taches.filter(t => computeEtatAv(t) === e.key);
      const entry: Record<string, string | number> = { name: e.label };
      STATUTS_TACHES.forEach(s => {
        entry[s === 'A faire' ? 'À faire' : s] = ts.filter(t => t.statut === s || (s === 'A faire' && t.statut === 'À faire')).length;
      });
      return entry;
    }).filter(e => STATUTS_TACHES.some(s => ((e[s === 'A faire' ? 'À faire' : s] as number) ?? 0) > 0)),
  [taches]);

  // ── Tâches en retard ─────────────────────────────────────────────────────────
  const tachesEnRetard = useMemo(() =>
    taches
      .filter(isEnRetard)
      .map(t => ({ ...t, jours: joursRetard(t) }))
      .sort((a, b) => b.jours - a.jours),
  [taches]);

  // ── Stats par ressource ──────────────────────────────────────────────────────
  const statsRessource = useMemo(() => {
    const map = new Map<string, {
      personne: Personne;
      total: number; terminees: number; enCours: number; enRetard: number; nonDemarrees: number;
      taches: Tache[];
    }>();
    const membres = [...projet.equipeProjet];
    if (!membres.find(m => m.id === projet.chefProjet.id)) membres.unshift(projet.chefProjet);
    membres.forEach(p => {
      if (!map.has(p.id)) map.set(p.id, { personne: p, total: 0, terminees: 0, enCours: 0, enRetard: 0, nonDemarrees: 0, taches: [] });
    });
    taches.forEach(t => {
      if (!t.assigneA) return;
      if (!map.has(t.assigneA.id)) map.set(t.assigneA.id, { personne: t.assigneA, total: 0, terminees: 0, enCours: 0, enRetard: 0, nonDemarrees: 0, taches: [] });
      const s = map.get(t.assigneA.id)!;
      s.total++; s.taches.push(t);
      if (isTerminee(t.statut))    s.terminees++;
      else if (isEnCours(t.statut))  s.enCours++;
      else if (isNonDemarree(t.statut)) s.nonDemarrees++;
      if (isEnRetard(t)) s.enRetard++;
    });
    let arr = [...map.values()];
    if (sortRessource === 'taux')   arr.sort((a, b) => (b.total > 0 ? b.terminees / b.total : -1) - (a.total > 0 ? a.terminees / a.total : -1));
    if (sortRessource === 'retard') arr.sort((a, b) => b.enRetard - a.enRetard);
    if (sortRessource === 'total')  arr.sort((a, b) => b.total - a.total);
    return arr;
  }, [taches, projet.equipeProjet, projet.chefProjet, sortRessource]);

  // ── Stats par entité ─────────────────────────────────────────────────────────
  const statsEntite = useMemo(() => {
    const map = new Map<string, {
      entite: Entite; membres: Set<string>;
      total: number; terminees: number; enCours: number; enRetard: number; nonDemarrees: number;
      taches: Tache[];
    }>();
    taches.forEach(t => {
      if (!t.assigneA) return;
      const e = t.assigneA.entite;
      if (!map.has(e.id)) map.set(e.id, { entite: e, membres: new Set(), total: 0, terminees: 0, enCours: 0, enRetard: 0, nonDemarrees: 0, taches: [] });
      const s = map.get(e.id)!;
      s.membres.add(t.assigneA.id); s.total++; s.taches.push(t);
      if (isTerminee(t.statut))      s.terminees++;
      else if (isEnCours(t.statut))    s.enCours++;
      else if (isNonDemarree(t.statut)) s.nonDemarrees++;
      if (isEnRetard(t)) s.enRetard++;
    });
    let arr = [...map.values()];
    if (sortEntite === 'taux')   arr.sort((a, b) => (b.total > 0 ? b.terminees / b.total : -1) - (a.total > 0 ? a.terminees / a.total : -1));
    if (sortEntite === 'retard') arr.sort((a, b) => b.enRetard - a.enRetard);
    if (sortEntite === 'total')  arr.sort((a, b) => b.total - a.total);
    return arr;
  }, [taches, sortEntite]);

  const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    'À planifier': { label: 'À planifier', color: 'text-slate-600',  bg: 'bg-slate-100'  },
    'A faire':     { label: 'À faire',     color: 'text-blue-600',   bg: 'bg-blue-100'   },
    'En cours':    { label: 'En cours',    color: 'text-amber-600',  bg: 'bg-amber-100'  },
    'En attente':  { label: 'En attente',  color: 'text-purple-600', bg: 'bg-purple-100' },
    'Terminé':     { label: 'Terminé',     color: 'text-green-700',  bg: 'bg-green-100'  },
    'Validé':      { label: 'Validé',      color: 'text-teal-700',   bg: 'bg-teal-100'   },
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8" style={{ fontFamily: 'Sora, ui-sans-serif' }}>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — DASHBOARD MACRO
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <BarChart2 size={18} className="text-primary" />
          <h2 className="text-lg font-bold text-primary">Dashboard macro — Exécution des tâches</h2>
        </div>

        {/* ── 10 MetricCards (même grille que le dashboard tâches) ── */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10">
          <MetricCard title="Total tâches"  value={kpi.total} />
          <MetricCard title="En cours"      value={kpi.enCours}      rightValue={`${safePct(kpi.enCours,      kpi.total)}%`} tone="text-amber-600" />
          <MetricCard title="En attente"    value={kpi.enAttente}    rightValue={`${safePct(kpi.enAttente,    kpi.total)}%`} tone="text-purple-600" />
          <MetricCard title="À faire"       value={kpi.aFaire}       rightValue={`${safePct(kpi.aFaire,       kpi.total)}%`} tone="text-blue-600" />
          <MetricCard title="Terminées"     value={kpi.terminees}    rightValue={`${safePct(kpi.terminees,    kpi.total)}%`} tone="text-green-600" />
          <MetricCard title="Validées"      value={kpi.validees}     rightValue={`${safePct(kpi.validees,     kpi.total)}%`} tone="text-emerald-600" />
          <MetricCard title="% Achèvement"  value={`${kpi.achevement}%`}                                                    tone="text-emerald-600" />
          <MetricCard title="En retard"     value={kpi.enRetardCount} rightValue={`${safePct(kpi.enRetardCount, kpi.total)}%`} tone="text-red-600" />
          <MetricCard title="Non assignées" value={kpi.nonAssignees} rightValue={`${safePct(kpi.nonAssignees, kpi.total)}%`} tone="text-slate-500" />
          <MetricCard title="Bloquantes"    value={kpi.bloquantes}   rightValue={`${safePct(kpi.bloquantes,   kpi.total)}%`} tone="text-red-600" />
        </div>

        {/* ── Graphiques ligne 1 ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Pie statut */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800 mb-2">Répartition par statut</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={taskStatusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                  label={({ value, percent }) => value > 0 ? `${value} (${(percent * 100).toFixed(0)}%)` : ''} labelLine={false}>
                  {taskStatusPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [v, 'tâches']} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Pie priorité */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800 mb-2">Répartition par priorité</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={taskPrioriteData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                  label={({ value, percent }) => value > 0 ? `${value} (${(percent * 100).toFixed(0)}%)` : ''} labelLine={false}>
                  {taskPrioriteData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [v, 'tâches']} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar état d'avancement */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800 mb-2">Répartition par état d&apos;avancement</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tachesParEtatAvancement} margin={{ top: 16, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(v: number) => [v, 'tâches']} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {tachesParEtatAvancement.map((e, i) => <Cell key={i} fill={e.color} />)}
                  <LabelList dataKey="value" position="top"
                    style={{ fontSize: 12, fontWeight: 600, fill: '#475569' }}
                    formatter={(v: number) => `${v} (${safePct(v, kpi.total)}%)`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Graphiques ligne 2 ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Statut par priorité */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800 mb-2">Statut par priorité</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statutParPriorite} margin={{ top: 16, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="À planifier" stackId="a" fill="#94a3b8" />
                <Bar dataKey="À faire"     stackId="a" fill="#3b82f6" />
                <Bar dataKey="En cours"    stackId="a" fill="#f59e0b" />
                <Bar dataKey="En attente"  stackId="a" fill="#ef4444" />
                <Bar dataKey="Terminé"     stackId="a" fill="#22c55e" />
                <Bar dataKey="Validé"      stackId="a" fill="#10b981" radius={[4,4,0,0]}>
                  <LabelList
                    valueAccessor={(e: Record<string,number>) =>
                      ['À planifier','À faire','En cours','En attente','Terminé','Validé'].reduce((s,k)=>s+(e[k]||0),0)}
                    position="top"
                    style={{ fontSize: 11, fontWeight: 600, fill: '#475569' }}
                    formatter={(v:number) => v > 0 ? v : ''} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Avancement par priorité */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800 mb-2">Avancement par priorité</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={avancementParPriorite} margin={{ top: 16, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="En avance"  stackId="a" fill="#22c55e" />
                <Bar dataKey="À l'heure" stackId="a" fill="#3b82f6" />
                <Bar dataKey="En retard"  stackId="a" fill="#f97316" />
                <Bar dataKey="Hors délai" stackId="a" fill="#ef4444" radius={[4,4,0,0]}>
                  <LabelList
                    valueAccessor={(e: Record<string,number>) =>
                      ['En avance',"À l'heure",'En retard','Hors délai'].reduce((s,k)=>s+(e[k]||0),0)}
                    position="top"
                    style={{ fontSize: 11, fontWeight: 600, fill: '#475569' }}
                    formatter={(v:number) => v > 0 ? v : ''} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Statut par avancement */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800 mb-2">Statut par avancement</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statutParEtatAvancement} margin={{ top: 16, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="À planifier" stackId="a" fill="#94a3b8" />
                <Bar dataKey="À faire"     stackId="a" fill="#3b82f6" />
                <Bar dataKey="En cours"    stackId="a" fill="#f59e0b" />
                <Bar dataKey="En attente"  stackId="a" fill="#ef4444" />
                <Bar dataKey="Terminé"     stackId="a" fill="#22c55e" />
                <Bar dataKey="Validé"      stackId="a" fill="#10b981" radius={[4,4,0,0]}>
                  <LabelList
                    valueAccessor={(e: Record<string,number>) =>
                      ['À planifier','À faire','En cours','En attente','Terminé','Validé'].reduce((s,k)=>s+(e[k]||0),0)}
                    position="top"
                    style={{ fontSize: 11, fontWeight: 600, fill: '#475569' }}
                    formatter={(v:number) => v > 0 ? v : ''} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Ligne de risques ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <RiskCard label="Risque de Retard"           score={kpi.risqueRetard}     thresholds={[15, 30, 50]} />
          <RiskCard label="Risque Hors délai"          score={kpi.risqueHorsDelai}  thresholds={[5,  15, 25]} />
          <RiskCard label="Risque Faible Progression"  score={kpi.risqueFaibleProg} thresholds={[20, 40, 60]} />
          <RiskCard label="Risque de Suspension"       score={kpi.risqueSuspension} thresholds={[10, 20, 35]} />
          <RiskCard label="Risque Global"              score={kpi.risqueGlobal}     thresholds={[15, 30, 50]} />
        </div>

        {/* ── Tâches en retard ── */}
        {tachesEnRetard.length > 0 && (
          <div className="bg-white rounded-2xl border border-red-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-red-700 mb-4 flex items-center gap-2">
              Tâches en retard ({tachesEnRetard.length})
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
                  {tachesEnRetard.map(t => {
                    const cfg = STATUT_CONFIG[t.statut] ?? { label: t.statut, color: 'text-slate-600', bg: 'bg-slate-100' };
                    return (
                      <tr key={t.id} className="hover:bg-red-50/30 transition-colors">
                        <td className="py-2 font-medium text-slate-700 max-w-[200px] truncate">{t.libelle}</td>
                        <td className="py-2 text-slate-600">
                          {t.assigneA
                            ? `${t.assigneA.prenoms} ${t.assigneA.nom}`
                            : <span className="text-slate-400 italic">Non assigné</span>}
                        </td>
                        <td className="py-2 text-slate-500">{t.assigneA?.entite?.libelle ?? '—'}</td>
                        <td className="py-2 text-center text-slate-500">{fmtDate(t.dateFinPrevisionnelle)}</td>
                        <td className="py-2 text-center">
                          <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{t.jours}j</span>
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
                const taux     = total > 0 ? terminees / total : 0;
                const perf     = getPerformanceLabel(taux, enRetard, total);
                const PerfIcon = perf.icon;
                const isExpanded = expandedResource === personne.id;
                const isChef   = personne.id === projet.chefProjet.id;
                return [
                  <tr key={personne.id} className={`hover:bg-slate-50 transition-colors ${isChef ? 'bg-primary/[0.02]' : ''}`}>
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
                    <td className="px-3 py-3 text-center"><span className="font-bold text-slate-700">{total}</span></td>
                    <td className="px-3 py-3 text-center"><span className={`font-semibold ${terminees > 0 ? 'text-green-700' : 'text-slate-400'}`}>{terminees}</span></td>
                    <td className="px-3 py-3 text-center"><span className={`font-semibold ${enCours > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{enCours}</span></td>
                    <td className="px-3 py-3 text-center"><span className={`font-semibold ${enRetard > 0 ? 'text-red-600' : 'text-slate-400'}`}>{enRetard}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={terminees} max={total} color={taux >= 0.75 ? 'bg-green-500' : taux >= 0.4 ? 'bg-amber-400' : 'bg-red-400'} />
                        <span className="text-xs font-bold min-w-[36px] text-right text-slate-700">{pct(terminees, total)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${perf.classes}`}>
                        <PerfIcon size={10} />{perf.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {total > 0 && (
                        <button type="button" onClick={() => setExpandedResource(isExpanded ? null : personne.id)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
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
                                const jr  = joursRetard(t);
                                return (
                                  <tr key={t.id} className={isEnRetard(t) ? 'bg-red-50/40' : ''}>
                                    <td className="py-1.5 font-medium text-slate-700 max-w-[220px] truncate">{t.libelle}</td>
                                    <td className="py-1.5 text-center">
                                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                                    </td>
                                    <td className="py-1.5 text-center text-slate-500">{normalizePriorite(t.priorite)}</td>
                                    <td className="py-1.5 text-center text-slate-500">{fmtDate(t.dateFinPrevisionnelle)}</td>
                                    <td className="py-1.5 text-center">
                                      {jr > 0
                                        ? <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">{jr}j</span>
                                        : <span className="text-slate-300">—</span>}
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
            {(['Excellent','Bon','À surveiller','En difficulté'] as const).map(lbl => {
              const count = statsRessource.filter(r => getPerformanceLabel(r.total > 0 ? r.terminees / r.total : 0, r.enRetard, r.total).label === lbl).length;
              const tone = lbl === 'Excellent' ? 'text-green-700' : lbl === 'Bon' ? 'text-blue-700' : lbl === 'À surveiller' ? 'text-amber-700' : 'text-red-700';
              return <span key={lbl} className={`font-semibold ${tone}`}>{count} {lbl}</span>;
            })}
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
                  const taux       = total > 0 ? terminees / total : 0;
                  const isExpanded = expandedEntite === entite.id;

                  const membresStats = (() => {
                    const m = new Map<string, { personne: Personne; total: number; terminees: number; enRetard: number }>();
                    tachesE.forEach(t => {
                      if (!t.assigneA) return;
                      const pid = t.assigneA.id;
                      if (!m.has(pid)) m.set(pid, { personne: t.assigneA, total: 0, terminees: 0, enRetard: 0 });
                      const s = m.get(pid)!;
                      s.total++;
                      if (isTerminee(t.statut)) s.terminees++;
                      if (isEnRetard(t))        s.enRetard++;
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
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">{membres.size}</span>
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-slate-700">{total}</td>
                      <td className="px-3 py-3 text-center"><span className={`font-semibold ${terminees > 0 ? 'text-green-700' : 'text-slate-400'}`}>{terminees}</span></td>
                      <td className="px-3 py-3 text-center"><span className={`font-semibold ${enCours > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{enCours}</span></td>
                      <td className="px-3 py-3 text-center"><span className={`font-semibold ${nonDemarrees > 0 ? 'text-blue-600' : 'text-slate-400'}`}>{nonDemarrees}</span></td>
                      <td className="px-3 py-3 text-center"><span className={`font-semibold ${enRetard > 0 ? 'text-red-600' : 'text-slate-400'}`}>{enRetard}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={terminees} max={total} color={taux >= 0.75 ? 'bg-green-500' : taux >= 0.4 ? 'bg-amber-400' : 'bg-red-400'} />
                          <span className="text-xs font-bold min-w-[36px] text-right text-slate-700">{pct(terminees, total)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <button type="button" onClick={() => setExpandedEntite(isExpanded ? null : entite.id)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
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
                                    <td className="py-1.5 font-medium text-slate-700">{ms.personne.prenoms} {ms.personne.nom}</td>
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
