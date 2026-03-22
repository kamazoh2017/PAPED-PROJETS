'use client';

import { useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';

type Avancement = 'retard' | 'a-lheure' | 'en-avance' | 'hors-delai';

interface Tache {
  id: string;
  libelle: string;
  statut: string;
  priorite: string;
  projetId?: string;
  dateDebutPrevisionnelle?: string;
  dateFinPrevisionnelle?: string;
  dateDebutEffective?: string;
  dateFinEffective?: string;
  projet?: { libelle: string; id: string };
  assigneA?: { id: string; nom: string; prenoms: string };
  etatAvancement?: string;
  progression?: number;
}

interface Projet {
  id: string;
  libelle: string;
  statut: string;
  etatAvancement?: string;
  dateCreation: string;
  dateDebutPrevisionnelle?: string;
  dateFinPrevisionnelle?: string;
  dateFinEffective?: string;
  taches: Tache[];
  chefProjet?: { id: string; nom: string; prenoms: string };
}

const STATUTS_TACHES = ['À planifier', 'A faire', 'En cours', 'En attente', 'Terminé', 'Validé'];

const STATUT_TACHE_COLOR: Record<string, string> = {
  'À planifier': '#94a3b8',  // slate
  'A faire':     '#3b82f6',  // bleu
  'En cours':    '#f59e0b',  // ambre
  'En attente':  '#ef4444',  // rouge
  'Terminé':     '#22c55e',  // vert clair
  'Validé':      '#10b981',  // vert émeraude
};

function parseDate(value?: string): number | null {
  if (!value) return null;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? null : ts;
}

function normalizePriority(value?: string): 'Bloquant' | 'Critique' | 'Normal' {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'haute' || raw === 'bloquant') return 'Bloquant';
  if (raw === 'moyenne' || raw === 'moyen' || raw === 'critique') return 'Critique';
  if (raw === 'basse' || raw === 'faible' || raw === 'normal') return 'Normal';
  return 'Critique';
}

function getTaskProgressionByStatus(statut?: string): number {
  switch (String(statut ?? '').trim().toLowerCase()) {
    case 'à planifier':
    case 'a planifier':
    case 'a faire':
    case 'à faire':
      return 0;
    case 'en cours':
    case 'en attente':
      return 50;
    case 'termine':
    case 'terminé':
      return 99;
    case 'valide':
    case 'validé':
      return 100;
    default:
      return 0;
  }
}

function getPriorityWeight(priorite?: string): number {
  const normalized = normalizePriority(priorite);
  if (normalized === 'Bloquant') return 3;
  if (normalized === 'Critique') return 2;
  return 1;
}

function getWeightedProgression(tasks: Tache[]): number {
  if (!tasks.length) return 0;

  const weightedSum = tasks.reduce((acc, task) => {
    const progression = getTaskProgressionByStatus(task.statut);
    const poids = getPriorityWeight(task.priorite);
    return acc + progression * poids;
  }, 0);

  const totalWeight = tasks.reduce((acc, task) => acc + getPriorityWeight(task.priorite), 0);
  if (!totalWeight) return 0;

  return Math.round(weightedSum / totalWeight);
}

function isTaskDone(statut?: string): boolean {
  const normalized = String(statut ?? '').trim().toLowerCase();
  return normalized === 'termine' || normalized === 'terminé' || normalized === 'valide' || normalized === 'validé';
}


function clampRisk(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getRiskLevel(score: number): 'Faible' | 'Moyen' | 'Élevé' | 'Critique' {
  if (score <= 25) return 'Faible';
  if (score <= 50) return 'Moyen';
  if (score <= 75) return 'Élevé';
  return 'Critique';
}

function getRiskScoreBadgeStyle(score: number): React.CSSProperties {
  const level = getRiskLevel(score);
  if (level === 'Critique') return { backgroundColor: '#fee2e2', color: '#b91c1c' };
  if (level === 'Élevé')    return { backgroundColor: '#ffedd5', color: '#c2410c' };
  if (level === 'Moyen')    return { backgroundColor: '#fef9c3', color: '#a16207' };
  return { backgroundColor: '#dcfce7', color: '#15803d' };
}

function getExpectedProgressByPlannedTime(project: Projet, nowTs: number): number {
  const startTs = parseDate(project.dateDebutPrevisionnelle) ?? parseDate(project.dateCreation);
  const endTs = parseDate(project.dateFinPrevisionnelle);
  if (startTs === null || endTs === null || endTs <= startTs) return 0;
  if (nowTs <= startTs) return 0;
  if (nowTs >= endTs) return 100;
  return clampRisk(((nowTs - startTs) / (endTs - startTs)) * 100);
}

function getRealProgress(project: Projet): number {
  return getWeightedProgression(project.taches ?? []);
}

function getProjectProgressMetrics(project: Projet, nowTs: number): { real: number; expected: number } {
  return {
    real: getRealProgress(project),
    expected: getExpectedProgressByPlannedTime(project, nowTs),
  };
}

function getProjectAvancement(project: Projet, nowTs: number): Avancement {

  const finPrev = parseDate(project.dateFinPrevisionnelle);

  // Date de fin effective projet: prendre la date explicite si disponible, sinon la dernière fin effective des tâches terminées.
  const explicitFinEff = parseDate(project.dateFinEffective);
  const taskFinEff = (project.taches ?? [])
    .map((t) => parseDate(t.dateFinEffective))
    .filter((ts): ts is number => ts !== null)
    .sort((a, b) => b - a)[0] ?? null;
  const finEffectiveProjet = explicitFinEff ?? taskFinEff;

  // Hors délai grave si la fin effective projet dépasse la fin prévisionnelle.
  if (finPrev !== null && finEffectiveProjet !== null && finEffectiveProjet > finPrev) {
    return 'hors-delai';
  }

  const { real, expected } = getProjectProgressMetrics(project, nowTs);
  const delta = real - expected;
  if (delta > 5) return 'en-avance';
  if (delta < -5) return 'retard';
  return 'a-lheure';
}

function getProjectRiskScores(project: Projet, nowTs: number) {
  const tasks = project.taches ?? [];
  const totalTasks = tasks.length;

  const tasksRetard = tasks.filter((t) => {
    const finPrev = parseDate(t.dateFinPrevisionnelle);
    return finPrev !== null && nowTs > finPrev && !isTaskDone(t.statut);
  }).length;

  const tasksTerminees = tasks.filter((t) => isTaskDone(t.statut));
  const tasksHorsDelai = tasksTerminees.filter((t) => {
    const finPrev = parseDate(t.dateFinPrevisionnelle);
    const finEff = parseDate(t.dateFinEffective);
    return finPrev !== null && finEff !== null && finEff > finPrev;
  }).length;

  const tasksCritiques = tasks.filter((t) => normalizePriority(t.priorite) === 'Critique').length;
  const tasksCritiquesEnAttente = tasks.filter(
    (t) => normalizePriority(t.priorite) === 'Critique' && String(t.statut ?? '').trim().toLowerCase() === 'en attente'
  ).length;

  const retard = clampRisk(safePct(tasksRetard, totalTasks));
  const horsDelai = clampRisk(safePct(tasksHorsDelai, tasksTerminees.length));
  const suspendu = clampRisk(safePct(tasksCritiquesEnAttente, tasksCritiques));

  const real = getRealProgress(project);
  const expected = getExpectedProgressByPlannedTime(project, nowTs);
  const progression = clampRisk(Math.max(0, expected - real));

  const global = clampRisk(
    0.3 * retard +
      0.2 * horsDelai +
      0.3 * progression +
      0.2 * suspendu
  );

  return {
    retard,
    horsDelai,
    progression,
    suspendu,
    global,
    level: getRiskLevel(global),
    expected,
    real,
  };
}

function safePct(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function MetricCard({
  title,
  value,
  subtitle,
  tone = 'text-primary',
  compact = false,
  rightValue,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  tone?: string;
  compact?: boolean;
  rightValue?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        compact ? 'p-3' : 'p-4'
      }`}
      style={{ fontFamily: 'Sora, ui-sans-serif' }}
    >
      <p className={`text-slate-500 uppercase tracking-[0.1em] ${compact ? 'text-[10px]' : 'text-[11px]'}`}>{title}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className={`font-semibold ${compact ? 'text-xl' : 'text-3xl'} ${tone}`}>{value}</p>
        {rightValue && <span className={`font-medium text-slate-500 ${compact ? 'text-xs' : 'text-sm'}`}>{rightValue}</span>}
      </div>
      {subtitle && <p className={`mt-1 leading-relaxed text-slate-400 ${compact ? 'text-[10px]' : 'text-xs'}`}>{subtitle}</p>}
    </div>
  );
}


export default function DashboardPage() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [taches, setTaches] = useState<Tache[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProjet, setFilterProjet] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [filterChefProjet, setFilterChefProjet] = useState('');
  const [periodeAvancement, setPeriodeAvancement] = useState<'jours' | 'semaines' | 'mois'>('semaines');
  const [dashboardView, setDashboardView] = useState<'projet' | 'taches'>('taches');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [proRes, tRes] = await Promise.all([fetch('/api/projets'), fetch('/api/taches')]);
        const projetsData = await proRes.json();
        const tachesData = await tRes.json();
        setProjets(Array.isArray(projetsData) ? projetsData : []);
        setTaches(Array.isArray(tachesData) ? tachesData : []);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Persiste les scores de risque calculés pour chaque projet actif après chaque chargement
  useEffect(() => {
    if (!projets.length) return;
    const now = Date.now();
    const actifs = projets.filter((p) => p.statut === 'En démarrage' || p.statut === 'En cours');
    actifs.forEach((project) => {
      const risk = getProjectRiskScores(project, now);
      fetch(`/api/projets/${project.id}/risques`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retard:      risk.retard,
          horsDelai:   risk.horsDelai,
          progression: risk.progression,
          suspendu:    risk.suspendu,
          global:      risk.global,
        }),
      }).catch(() => {}); // silencieux — pas critique pour l'affichage
    });
  }, [projets]);

  useEffect(() => {
    if (dashboardView === 'taches') {
      setShowFilterPopup(false);
    }
  }, [dashboardView]);

  useEffect(() => {
    const handleToggle = () => setShowFilterPopup((prev) => !prev);
    const handleViewChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ view?: 'projet' | 'taches' }>;
      const nextView = customEvent.detail?.view;
      if (nextView === 'projet' || nextView === 'taches') {
        setDashboardView(nextView);
      }
    };
    window.addEventListener('dashboard:toggle-filters', handleToggle);
    window.addEventListener('dashboard:set-view', handleViewChange as EventListener);
    return () => {
      window.removeEventListener('dashboard:toggle-filters', handleToggle);
      window.removeEventListener('dashboard:set-view', handleViewChange as EventListener);
    };
  }, []);

  const nowTs = Date.now();

  const filteredTaches = useMemo(
    () =>
      taches.filter((t) => {
        if (filterProjet && t.projet?.id !== filterProjet && t.projetId !== filterProjet) return false;
        if (filterStatut && t.statut !== filterStatut) return false;
        return true;
      }),
    [taches, filterProjet, filterStatut]
  );

  const projectAvancement = useMemo(
    () => projets.map((project) => ({
      project,
      avancement: (project.etatAvancement ?? getProjectAvancement(project, nowTs)) as Avancement,
    })),
    [projets, nowTs]
  );

  const totalProjects = projets.length;
  const projectsTermines = projets.filter((p) => p.statut === 'Terminé').length;
  const projectsClotures = projets.filter((p) => p.statut === 'Clôturé').length;
  const projectsEnCours = projets.filter((p) => p.statut === 'En cours').length;
  const projectsNonDemarres = projets.filter((p) => p.statut === 'En démarrage').length;
  const projectsSuspendus = projets.filter((p) => p.statut === 'Suspendu').length;
  const tauxAchevement = safePct(projectsTermines + projectsClotures, totalProjects);
  const tauxProgressionGlobal = getWeightedProgression(taches);

  const projectsRetard = projectAvancement.filter((p) => p.avancement === 'retard').length;
  const projectsALHeure = projectAvancement.filter((p) => p.avancement === 'a-lheure').length;
  const projectsHorsDelai = projectAvancement.filter((p) => p.avancement === 'hors-delai').length;
  const pctProjectsTermines = safePct(projectsTermines, totalProjects);
  const pctProjectsClotures = safePct(projectsClotures, totalProjects);
  const pctProjectsEnCours = safePct(projectsEnCours, totalProjects);
  const pctProjectsRetard = safePct(projectsRetard, totalProjects);
  const pctProjectsHorsDelai = safePct(projectsHorsDelai, totalProjects);
  const pctProjectsNonDemarres = safePct(projectsNonDemarres, totalProjects);
  const pctProjectsSuspendus = safePct(projectsSuspendus, totalProjects);
  const projectsEnAvance = projectAvancement.filter((p) => p.avancement === 'en-avance').length;

  const statusPieData = [
    { name: 'En démarrage', value: projectsNonDemarres, color: '#3b82f6' },  // bleu
    { name: 'En cours',     value: projectsEnCours,     color: '#f97316' },  // orange
    { name: 'Terminés',     value: projectsTermines,    color: '#22c55e' },  // vert clair
    { name: 'Clôturés',     value: projectsClotures,    color: '#065f46' },  // vert foncé
    { name: 'Suspendus',    value: projectsSuspendus,   color: '#ef4444' },  // rouge
  ];

  const avancementPieData = [
    { name: 'En retard',  value: projectsRetard,    color: '#f97316' },  // orange
    { name: 'À l\'heure', value: projectsALHeure,   color: '#3b82f6' },  // bleu
    { name: 'Hors délai', value: projectsHorsDelai, color: '#ef4444' },  // rouge
    { name: 'En avance',  value: projectsEnAvance,  color: '#22c55e' },  // vert
  ];

  const riskByProject = useMemo(
    () => projets.map((project) => ({ project, risk: getProjectRiskScores(project, nowTs) })),
    [projets, nowTs]
  );

  const topRiskProjects = useMemo(
    () => [...riskByProject].sort((a, b) => b.risk.global - a.risk.global).slice(0, 10),
    [riskByProject]
  );

  const riskLevelDistribution = useMemo(() => {
    const base = [
      { level: 'Faible', count: 0, retard: 0, horsDelai: 0, progression: 0, suspendu: 0 },
      { level: 'Moyen', count: 0, retard: 0, horsDelai: 0, progression: 0, suspendu: 0 },
      { level: 'Élevé', count: 0, retard: 0, horsDelai: 0, progression: 0, suspendu: 0 },
      { level: 'Critique', count: 0, retard: 0, horsDelai: 0, progression: 0, suspendu: 0 },
    ];
    riskByProject.forEach(({ risk }) => {
      const row = base.find((b) => b.level === risk.level);
      if (row) {
        row.count += 1;
        row.retard += risk.retard;
        row.horsDelai += risk.horsDelai;
        row.progression += risk.progression;
        row.suspendu += risk.suspendu;
      }
    });
    return base;
  }, [riskByProject]);

  const topChefsDeProjet = useMemo(() => {
    const AVANCEMENT_FILTERS = ['en-avance', 'a-lheure', 'retard', 'hors-delai'];
    const isAvancementFilter = AVANCEMENT_FILTERS.includes(filterChefProjet);

    const map = new Map<string, { name: string; count: number }>();
    projets.forEach((p) => {
      if (!p.chefProjet?.id) return;

      if (filterChefProjet) {
        if (isAvancementFilter) {
          const av = projectAvancement.find((pa) => pa.project.id === p.id)?.avancement;
          if (av !== filterChefProjet) return;
        } else {
          // statut filter
          const statutMap: Record<string, string> = {
            'non-demarres': 'En démarrage',
            'en-cours':     'En cours',
            'suspendus':    'Suspendu',
            'termines':     'Terminé',
            'clotures':     'Clôturé',
          };
          if (p.statut !== statutMap[filterChefProjet]) return;
        }
      }

      const id = p.chefProjet.id;
      const name = `${p.chefProjet.prenoms} ${p.chefProjet.nom}`;
      const current = map.get(id) ?? { name, count: 0 };
      current.count += 1;
      map.set(id, current);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [projets, projectAvancement, filterChefProjet]);

  // Graphique 1: Distribution des projets par plage de progression
  const progressionByRange = useMemo(() => {
    const ranges = [
      { label: '0-20%', min: 0, max: 20, count: 0 },
      { label: '21-40%', min: 21, max: 40, count: 0 },
      { label: '41-60%', min: 41, max: 60, count: 0 },
      { label: '61-80%', min: 61, max: 80, count: 0 },
      { label: '81-99%', min: 81, max: 99, count: 0 },
      { label: '100%', min: 100, max: 100, count: 0 },
    ];
    projets.forEach((p) => {
      const total = p.taches?.length ?? 0;
      const done = p.taches?.filter((t) => t.statut === 'Terminé' || t.statut === 'Validé').length ?? 0;
      const progress = total === 0 ? 100 : safePct(done, total);
      const range = ranges.find((r) => progress >= r.min && progress <= r.max);
      if (range) range.count += 1;
    });
    return ranges;
  }, [projets]);

  // Graphique 2: Distribution des projets par statut (achèvement)
  const achievementData = useMemo(() => [
    { name: 'En démarrage', value: projectsNonDemarres, fill: '#3b82f6' },
    { name: 'En cours',     value: projectsEnCours,     fill: '#f97316' },
    { name: 'Terminés',     value: projectsTermines,    fill: '#22c55e' },
    { name: 'Clôturés',     value: projectsClotures,    fill: '#065f46' },
    { name: 'Suspendus',    value: projectsSuspendus,   fill: '#ef4444' },
  ].filter(d => d.value > 0), [projectsNonDemarres, projectsEnCours, projectsTermines, projectsClotures, projectsSuspendus]);

  // Graphique 3: Charge par chef de projet (barres empilées)
  const chargeChefProjet = useMemo(() => {
    const map = new Map<string, { name: string; 'En avance': number; 'À l\'heure': number; 'En retard': number; 'Hors délais': number }>();
    projets.forEach((p) => {
      if (!p.chefProjet?.id) return;
      const id = p.chefProjet.id;
      const name = `${p.chefProjet.prenoms} ${p.chefProjet.nom}`;
      const current = map.get(id) ?? { name, 'En avance': 0, 'À l\'heure': 0, 'En retard': 0, 'Hors délais': 0 };
      const av = projectAvancement.find((pa) => pa.project.id === p.id)?.avancement;
      if (av === 'en-avance')   current['En avance'] += 1;
      else if (av === 'a-lheure')   current['À l\'heure'] += 1;
      else if (av === 'retard')     current['En retard'] += 1;
      else if (av === 'hors-delai') current['Hors délais'] += 1;
      map.set(id, current);
    });
    return Array.from(map.values()).sort((a, b) =>
      (b['En avance'] + b['À l\'heure'] + b['En retard'] + b['Hors délais']) -
      (a['En avance'] + a['À l\'heure'] + a['En retard'] + a['Hors délais'])
    ).slice(0, 10);
  }, [projets, projectAvancement]);

  // Graphique 4: Avancement vs Temps (progression réelle et attendue)
  const avancementVsTemps = useMemo(() => {
    const now = new Date();
    const config =
      periodeAvancement === 'jours'
        ? { points: 14, stepDays: 1, label: (idx: number) => `J-${14 - idx}` }
        : periodeAvancement === 'mois'
          ? { points: 12, stepDays: 30, label: (idx: number) => `M-${12 - idx}` }
          : { points: 12, stepDays: 7, label: (idx: number) => `S-${12 - idx}` };

    const series: Array<{ periode: string; reel: number; attendu: number }> = [];

    for (let i = config.points; i >= 0; i--) {
      const snapshot = new Date(now);
      snapshot.setDate(snapshot.getDate() - i * config.stepDays);
      const snapshotTs = snapshot.getTime();

      const metrics = projets.map((p) => getProjectProgressMetrics(p, snapshotTs));
      const reel = metrics.length ? Math.round(metrics.reduce((acc, m) => acc + m.real, 0) / metrics.length) : 0;
      const attendu = metrics.length ? Math.round(metrics.reduce((acc, m) => acc + m.expected, 0) / metrics.length) : 0;

      series.push({
        periode: config.label(i),
        reel,
        attendu,
      });
    }

    return series;
  }, [projets, periodeAvancement]);

  // ── KPIs tâches ──────────────────────────────────────────────────────────────
  const totalTachesFiltered   = filteredTaches.length;
  const tachesEnCoursCount    = filteredTaches.filter(t => t.statut === 'En cours').length;
  const tachesEnAttenteCount  = filteredTaches.filter(t => t.statut === 'En attente').length;
  const tachesTermineesCount  = filteredTaches.filter(t => t.statut === 'Terminé').length;
  const tachesValideesCount   = filteredTaches.filter(t => t.statut === 'Validé').length;
  const tachesAFaireCount     = filteredTaches.filter(t => t.statut === 'A faire').length;
  const tachesAcheveesCount      = tachesTermineesCount + tachesValideesCount;
  const tauxAchevementTaches     = safePct(tachesAcheveesCount, totalTachesFiltered);
  const tachesNonAssigneesCount = filteredTaches.filter(t => !t.assigneA).length;
  const tachesBloquantesCount = filteredTaches.filter(t => normalizePriority(t.priorite) === 'Bloquant').length;
  const tachesEnRetardCount   = filteredTaches.filter(t => {
    const fin = parseDate(t.dateFinPrevisionnelle);
    return fin !== null && nowTs > fin && !isTaskDone(t.statut);
  }).length;

  // ── Pie statut tâches ────────────────────────────────────────────────────────
  const taskStatusPieData = STATUTS_TACHES
    .map(s => ({
      name: s === 'A faire' ? 'À faire' : s,
      value: filteredTaches.filter(t => t.statut === s || (s === 'A faire' && t.statut === 'À faire')).length,
      color: STATUT_TACHE_COLOR[s] ?? '#94a3b8',
    }))
    .filter(d => d.value > 0 || d.name === 'À faire');

  // ── Pie priorité tâches ──────────────────────────────────────────────────────
  const taskPrioriteData = [
    { name: 'Bloquant', value: filteredTaches.filter(t => normalizePriority(t.priorite) === 'Bloquant').length, color: '#ef4444' },
    { name: 'Critique', value: filteredTaches.filter(t => normalizePriority(t.priorite) === 'Critique').length, color: '#f59e0b' },
    { name: 'Normal',   value: filteredTaches.filter(t => normalizePriority(t.priorite) === 'Normal').length,   color: '#22c55e' },
  ].filter(d => d.value > 0);

  // ── Tâches par état d'avancement ──────────────────────────────────────────────
  const ETATS_AV = [
    { key: 'en-avance',  label: 'En avance',  color: '#22c55e' },
    { key: 'a-lheure',   label: 'À l\'heure', color: '#3b82f6' },
    { key: 'retard',     label: 'En retard',  color: '#f97316' },
    { key: 'hors-delai', label: 'Hors délai', color: '#ef4444' },
  ];
  const tachesParEtatAvancement = useMemo(() =>
    ETATS_AV.map(e => ({
      name: e.label,
      value: filteredTaches.filter(t => (t.etatAvancement ?? '') === e.key).length,
      color: e.color,
    })).filter(d => d.value > 0),
  [filteredTaches]);

  // ── Top assignés ─────────────────────────────────────────────────────────────
  const topAssignes = useMemo(() => {
    const map = new Map<string, { name: string; total: number; done: number; retard: number }>();
    filteredTaches.forEach(t => {
      if (!t.assigneA?.id) return;
      const id = t.assigneA.id;
      const entry = map.get(id) ?? { name: `${t.assigneA.prenoms} ${t.assigneA.nom}`, total: 0, done: 0, retard: 0 };
      entry.total += 1;
      if (isTaskDone(t.statut)) entry.done += 1;
      const fin = parseDate(t.dateFinPrevisionnelle);
      if (fin && nowTs > fin && !isTaskDone(t.statut)) entry.retard += 1;
      map.set(id, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [filteredTaches, nowTs]);

  // ── Statut par priorité ──────────────────────────────────────────────────────
  const PRIO_LIST = ['Bloquant', 'Critique', 'Normal'];

  const statutParPriorite = useMemo(() =>
    PRIO_LIST.map(prio => {
      const tasks = filteredTaches.filter(t => normalizePriority(t.priorite) === prio);
      const entry: Record<string, string | number> = { name: prio };
      STATUTS_TACHES.forEach(s => { entry[s === 'A faire' ? 'À faire' : s] = tasks.filter(t => t.statut === s || (s === 'A faire' && t.statut === 'À faire')).length; });
      return entry;
    }),
  [filteredTaches]);

  // ── Avancement par priorité ───────────────────────────────────────────────────
  const avancementParPriorite = useMemo(() =>
    PRIO_LIST.map(prio => {
      const tasks = filteredTaches.filter(t => normalizePriority(t.priorite) === prio);
      return {
        name: prio,
        'En avance':  tasks.filter(t => t.etatAvancement === 'en-avance').length,
        'À l\'heure': tasks.filter(t => t.etatAvancement === 'a-lheure').length,
        'En retard':  tasks.filter(t => t.etatAvancement === 'retard').length,
        'Hors délai': tasks.filter(t => t.etatAvancement === 'hors-delai').length,
      };
    }),
  [filteredTaches]);

  // ── Statut par état d'avancement ──────────────────────────────────────────────
  const statutParEtatAvancement = useMemo(() =>
    ETATS_AV.map(e => {
      const tasks = filteredTaches.filter(t => (t.etatAvancement ?? '') === e.key);
      const entry: Record<string, string | number> = { name: e.label };
      STATUTS_TACHES.forEach(s => { entry[s === 'A faire' ? 'À faire' : s] = tasks.filter(t => t.statut === s || (s === 'A faire' && t.statut === 'À faire')).length; });
      return entry;
    }).filter(e => STATUTS_TACHES.some(s => ((e[s === 'A faire' ? 'À faire' : s] as number) ?? 0) > 0)),
  [filteredTaches]);

  // ── Statut par état d'avancement par ressource (trié par priorité) ──────────────
  const resourceStatutParAvancement = useMemo(() => {
    const AV_MAP: Record<string, string> = {
      'en-avance': 'En avance', 'a-lheure': "À l'heure",
      'retard': 'En retard', 'hors-delai': 'Hors délai',
    };
    const map = new Map<string, Record<string, string | number>>();
    filteredTaches.forEach(t => {
      if (!t.assigneA?.id) return;
      const id = t.assigneA.id;
      const name = `${t.assigneA.prenoms} ${t.assigneA.nom}`;
      const entry = map.get(id) ?? {
        name, _poids: 0,
        'En avance': 0, "À l'heure": 0, 'En retard': 0, 'Hors délai': 0,
      };
      const av = AV_MAP[t.etatAvancement ?? ''];
      if (av) entry[av] = ((entry[av] as number) || 0) + 1;
      (entry._poids as number) && void 0; // type hint
      entry._poids = ((entry._poids as number) || 0) + getPriorityWeight(t.priorite);
      map.set(id, entry);
    });
    return Array.from(map.values())
      .sort((a, b) => ((b._poids as number) || 0) - ((a._poids as number) || 0))
      .slice(0, 12);
  }, [filteredTaches]);

  // ── Tâches en retard (détail) ─────────────────────────────────────────────────
  const tachesEnRetardDetails = useMemo(() =>
    filteredTaches
      .filter(t => { const fin = parseDate(t.dateFinPrevisionnelle); return fin !== null && nowTs > fin && !isTaskDone(t.statut); })
      .sort((a, b) => getPriorityWeight(b.priorite) - getPriorityWeight(a.priorite) || (parseDate(a.dateFinPrevisionnelle) ?? 0) - (parseDate(b.dateFinPrevisionnelle) ?? 0))
      .slice(0, 10),
  [filteredTaches, nowTs]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500" style={{ fontFamily: 'Sora, ui-sans-serif' }}>
        Chargement du dashboard global...
      </div>
    );
  }

  return (
    <div className="space-y-7" style={{ fontFamily: 'Sora, ui-sans-serif' }}>
      {showFilterPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
          onClick={() => setShowFilterPopup(false)}
        >
          <section
            className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Filtres dashboard</h2>
              <button
                type="button"
                onClick={() => setShowFilterPopup(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
              >
                Fermer
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Filtrer par projet</label>
                <select
                  value={filterProjet}
                  onChange={(e) => setFilterProjet(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="">Tous les projets</option>
                  {projets.map((p) => (
                    <option key={p.id} value={p.id}>{p.libelle}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Filtrer par statut tache</label>
                <select
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="">Tous les statuts</option>
                  {STATUTS_TACHES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setFilterProjet('');
                  setFilterStatut('');
                }}
                className="rounded-lg bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700"
              >
                Reinitialiser les filtres
              </button>
            </div>
          </section>
        </div>
      )}

      <section className={`space-y-3 ${dashboardView === 'taches' ? 'hidden' : ''}`}>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10">
          <MetricCard title="Total projets"  value={totalProjects} compact />
          <MetricCard title="Terminés"       value={projectsTermines}    rightValue={`${pctProjectsTermines}%`}    tone="text-green-600"  compact />
          <MetricCard title="Clôturés"       value={projectsClotures}    rightValue={`${pctProjectsClotures}%`}    tone="text-emerald-700" compact />
          <MetricCard title="% Achèvement"   value={`${tauxAchevement}%`}                                          tone="text-emerald-600" compact />
          <MetricCard title="En cours"       value={projectsEnCours}     rightValue={`${pctProjectsEnCours}%`}     tone="text-orange-600" compact />
          <MetricCard title="% Progression"  value={`${tauxProgressionGlobal}%`}                                   tone="text-orange-600" compact />
          <MetricCard title="En retard"      value={projectsRetard}      rightValue={`${pctProjectsRetard}%`}      tone="text-red-600"    compact />
          <MetricCard title="Hors délais"    value={projectsHorsDelai}   rightValue={`${pctProjectsHorsDelai}%`}   tone="text-orange-500" compact />
          <MetricCard title="En démarrage"   value={projectsNonDemarres} rightValue={`${pctProjectsNonDemarres}%`} tone="text-blue-600"   compact />
          <MetricCard title="Suspendus"      value={projectsSuspendus}   rightValue={`${pctProjectsSuspendus}%`}   tone="text-red-600"    compact />
        </div>
      </section>

      <section className={`grid grid-cols-1 gap-4 lg:grid-cols-3 ${dashboardView === 'taches' ? 'hidden' : ''}`}>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-2">Répartition par statut</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                label={({ value, percent }) => value > 0 ? `${value} (${(percent * 100).toFixed(0)}%)` : ''}
                labelLine={false}
              >
                {statusPieData.map((entry, i) => (
                  <Cell key={`s-${i}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [v, 'projets']} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Distribution achèvement</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={achievementData} margin={{ top: 20, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(v: number) => [v, 'projets']} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {achievementData.map((entry, i) => (
                  <Cell key={`ach-${i}`} fill={entry.fill} />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  style={{ fontSize: 12, fontWeight: 600, fill: '#475569' }}
                  formatter={(v: number) => `${v} (${safePct(v, totalProjects)}%)`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-2">Avancement (délais)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={avancementPieData} layout="vertical" margin={{ top: 4, right: 36, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={84} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [v, 'projets']} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {avancementPieData.map((entry) => (
                  <Cell key={`a-${entry.name}`} fill={entry.color} />
                ))}
                <LabelList dataKey="value" position="right" style={{ fontSize: 12, fontWeight: 600, fill: '#475569' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className={`grid grid-cols-1 gap-4 lg:grid-cols-3 ${dashboardView === 'taches' ? 'hidden' : ''}`}>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-800">Avancement vs Temps</h3>
            <select
              value={periodeAvancement}
              onChange={(e) => setPeriodeAvancement(e.target.value as 'jours' | 'semaines' | 'mois')}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="jours">Jours</option>
              <option value="semaines">Semaines</option>
              <option value="mois">Mois</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={avancementVsTemps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="periode" tick={{ fontSize: 12 }} />
              <YAxis label={{ value: '% Progression', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Legend />
              <Line type="monotone" dataKey="reel" stroke="#3b82f6" name="Progression réelle" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} label={false} />
              <Line type="monotone" dataKey="attendu" stroke="#94a3b8" name="Progression attendue" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#94a3b8' }} label={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Distribution par avancement (%)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={progressionByRange}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis label={{ value: 'Nb projets', angle: -90, position: 'insideLeft' }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]}>
                <LabelList dataKey="count" position="top" style={{ fontSize: 12, fontWeight: 600, fill: '#475569' }} formatter={(v: number) => v > 0 ? v : ''} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className={`grid grid-cols-1 gap-4 lg:grid-cols-3 ${dashboardView === 'taches' ? 'hidden' : ''}`}>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Charge par chef de projet</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chargeChefProjet} layout="vertical" margin={{ top: 4, right: 40, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="En avance"   stackId="a" fill="#22c55e" />
              <Bar dataKey="À l'heure"  stackId="a" fill="#3b82f6" />
              <Bar dataKey="En retard"   stackId="a" fill="#f97316" />
              <Bar dataKey="Hors délais" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]}>
                <LabelList
                  valueAccessor={(entry: Record<string, number>) =>
                    (entry['En avance'] ?? 0) + (entry['À l\'heure'] ?? 0) + (entry['En retard'] ?? 0) + (entry['Hors délais'] ?? 0)
                  }
                  position="right"
                  style={{ fontSize: 12, fontWeight: 600, fill: '#475569' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-base font-semibold text-slate-800">Top 10 chefs de projet</h3>
            <select
              value={filterChefProjet}
              onChange={(e) => setFilterChefProjet(e.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Tous les projets</option>
              <option value="non-demarres">Non démarrés</option>
              <option value="en-cours">En cours</option>
              <option value="suspendus">Suspendus</option>
              <option value="termines">Terminés</option>
              <option value="clotures">Clôturés</option>
              <option value="en-avance">En avance</option>
              <option value="a-lheure">A l'heure</option>
              <option value="retard">En retard</option>
              <option value="hors-delai">Hors délais</option>
            </select>
          </div>
          {topChefsDeProjet.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun chef de projet trouvé.</p>
          ) : (
            <ol className="space-y-2">
              {topChefsDeProjet.map((chef, idx) => (
                <li key={chef.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center">{idx + 1}</span>
                    <span className="text-sm font-medium text-slate-700 truncate">{chef.name}</span>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{chef.count} projet{chef.count > 1 ? 's' : ''}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Niveaux de risque projets</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={riskLevelDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="level" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="retard"     name="Retard"       stackId="risk" fill="#ef4444" />
              <Bar dataKey="horsDelai"  name="Hors délai"   stackId="risk" fill="#f97316" />
              <Bar dataKey="progression" name="Progression" stackId="risk" fill="#3b82f6" />
              <Bar dataKey="suspendu"   name="Suspendu"     stackId="risk" fill="#7c3aed" radius={[8, 8, 0, 0]}>
                <LabelList
                  valueAccessor={(entry: Record<string, number>) =>
                    (entry.retard ?? 0) + (entry.horsDelai ?? 0) + (entry.progression ?? 0) + (entry.suspendu ?? 0)
                  }
                  position="top"
                  style={{ fontSize: 11, fontWeight: 600, fill: '#475569' }}
                  formatter={(v: number) => v > 0 ? v : ''}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${dashboardView === 'taches' ? 'hidden' : ''}`}>
        <h3 className="text-base font-semibold text-slate-800 mb-3">Top risques projets (score global)</h3>
        {topRiskProjects.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun projet à analyser.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-4">Projet</th>
                  <th className="py-2 pr-3">Global</th>
                  <th className="py-2 pr-3">Retard</th>
                  <th className="py-2 pr-3">Hors délai</th>
                  <th className="py-2 pr-3">Progression</th>
                  <th className="py-2 pr-3">Suspendu</th>
                </tr>
              </thead>
              <tbody>
                {topRiskProjects.map(({ project, risk }) => (
                  <tr key={project.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-700">{project.libelle}</td>
                    <td className="py-2 pr-3">
                      <span className="rounded px-2 py-1 text-xs font-semibold" style={getRiskScoreBadgeStyle(risk.global)}>{risk.global}%</span>
                    </td>
                    <td className="py-2 pr-3">
                      <span className="rounded px-2 py-1 text-xs font-semibold" style={getRiskScoreBadgeStyle(risk.retard)}>{risk.retard}%</span>
                    </td>
                    <td className="py-2 pr-3">
                      <span className="rounded px-2 py-1 text-xs font-semibold" style={getRiskScoreBadgeStyle(risk.horsDelai)}>{risk.horsDelai}%</span>
                    </td>
                    <td className="py-2 pr-3">
                      <span className="rounded px-2 py-1 text-xs font-semibold" style={getRiskScoreBadgeStyle(risk.progression)}>{risk.progression}%</span>
                    </td>
                    <td className="py-2 pr-3">
                      <span className="rounded px-2 py-1 text-xs font-semibold" style={getRiskScoreBadgeStyle(risk.suspendu)}>{risk.suspendu}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ═══════════════════ DASHBOARD TÂCHES ═══════════════════ */}

      {/* KPIs tâches */}
      <section className={`space-y-3 ${dashboardView === 'projet' ? 'hidden' : ''}`}>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10">
          <MetricCard title="Total tâches"    value={totalTachesFiltered} compact />
          <MetricCard title="En cours"        value={tachesEnCoursCount}   rightValue={`${safePct(tachesEnCoursCount, totalTachesFiltered)}%`}   tone="text-amber-600"   compact />
          <MetricCard title="En attente"      value={tachesEnAttenteCount} rightValue={`${safePct(tachesEnAttenteCount, totalTachesFiltered)}%`} tone="text-purple-600"  compact />
          <MetricCard title="À faire"         value={tachesAFaireCount}    rightValue={`${safePct(tachesAFaireCount, totalTachesFiltered)}%`}    tone="text-blue-600"    compact />
          <MetricCard title="Terminées"       value={tachesTermineesCount} rightValue={`${safePct(tachesTermineesCount, totalTachesFiltered)}%`} tone="text-green-600"   compact />
          <MetricCard title="Validées"        value={tachesValideesCount}  rightValue={`${safePct(tachesValideesCount, totalTachesFiltered)}%`}  tone="text-emerald-600" compact />
          <MetricCard title="% Achèvement"    value={`${tauxAchevementTaches}%`}                                                                    tone="text-emerald-600" compact />
          <MetricCard title="En retard"       value={tachesEnRetardCount}  rightValue={`${safePct(tachesEnRetardCount, totalTachesFiltered)}%`}  tone="text-red-600"     compact />
          <MetricCard title="Non assignées"   value={tachesNonAssigneesCount} rightValue={`${safePct(tachesNonAssigneesCount, totalTachesFiltered)}%`} tone="text-slate-500" compact />
          <MetricCard title="Bloquantes"      value={tachesBloquantesCount} rightValue={`${safePct(tachesBloquantesCount, totalTachesFiltered)}%`} tone="text-red-600"   compact />
        </div>
      </section>

      {/* Graphiques — ligne 1 */}
      <section className={`grid grid-cols-1 gap-4 lg:grid-cols-3 ${dashboardView === 'projet' ? 'hidden' : ''}`}>
        {/* Pie statut */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-2">Répartition par statut</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={taskStatusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                label={({ value, percent }) => value > 0 ? `${value} (${(percent * 100).toFixed(0)}%)` : ''}
                labelLine={false}
              >
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
                label={({ value, percent }) => value > 0 ? `${value} (${(percent * 100).toFixed(0)}%)` : ''}
                labelLine={false}
              >
                {taskPrioriteData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [v, 'tâches']} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition des tâches par état d'avancement */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-2">Répartition par état d'avancement</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tachesParEtatAvancement} margin={{ top: 16, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(v: number) => [v, 'tâches']} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {tachesParEtatAvancement.map((e, i) => <Cell key={i} fill={e.color} />)}
                <LabelList dataKey="value" position="top" style={{ fontSize: 12, fontWeight: 600, fill: '#475569' }}
                  formatter={(v: number) => `${v} (${safePct(v, totalTachesFiltered)}%)`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Graphiques — ligne 2 tâches : croisements */}
      <section className={`grid grid-cols-1 gap-4 lg:grid-cols-3 ${dashboardView === 'projet' ? 'hidden' : ''}`}>
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
                <LabelList valueAccessor={(e: Record<string,number>) =>
                  ['À planifier','À faire','En cours','En attente','Terminé','Validé'].reduce((s,k)=>s+(e[k]||0),0)}
                  position="top" style={{ fontSize: 11, fontWeight: 600, fill: '#475569' }}
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
              <Bar dataKey="En avance"   stackId="a" fill="#22c55e" />
              <Bar dataKey="À l'heure"  stackId="a" fill="#3b82f6" />
              <Bar dataKey="En retard"   stackId="a" fill="#f97316" />
              <Bar dataKey="Hors délai"  stackId="a" fill="#ef4444" radius={[4,4,0,0]}>
                <LabelList valueAccessor={(e: Record<string,number>) =>
                  ['En avance',"À l'heure",'En retard','Hors délai'].reduce((s,k)=>s+(e[k]||0),0)}
                  position="top" style={{ fontSize: 11, fontWeight: 600, fill: '#475569' }}
                  formatter={(v:number) => v > 0 ? v : ''} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Statut par état d'avancement */}
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
                <LabelList valueAccessor={(e: Record<string,number>) =>
                  ['À planifier','À faire','En cours','En attente','Terminé','Validé'].reduce((s,k)=>s+(e[k]||0),0)}
                  position="top" style={{ fontSize: 11, fontWeight: 600, fill: '#475569' }}
                  formatter={(v:number) => v > 0 ? v : ''} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Graphiques — ligne 3 tâches : statut par avancement par ressource */}
      <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${dashboardView === 'projet' ? 'hidden' : ''}`}>
        <h3 className="text-base font-semibold text-slate-800 mb-3">Statut par état d'avancement par ressource <span className="text-xs font-normal text-slate-400 ml-1">(trié par priorité)</span></h3>
        {resourceStatutParAvancement.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune assignation.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(240, resourceStatutParAvancement.length * 44)}>
            <BarChart data={resourceStatutParAvancement} margin={{ top: 16, right: 16, left: 8, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number, name: string) => [v, name]} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="En avance"  stackId="a" fill="#22c55e" />
              <Bar dataKey="À l'heure" stackId="a" fill="#3b82f6" />
              <Bar dataKey="En retard"  stackId="a" fill="#f97316" />
              <Bar dataKey="Hors délai" stackId="a" fill="#ef4444" radius={[4,4,0,0]}>
                <LabelList
                  valueAccessor={(e: Record<string, number>) =>
                    (e['En avance']||0) + (e["À l'heure"]||0) + (e['En retard']||0) + (e['Hors délai']||0)}
                  position="top"
                  style={{ fontSize: 12, fontWeight: 600, fill: '#475569' }}
                  formatter={(v: number) => v > 0 ? v : ''}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Graphiques — ligne 4 */}
      <section className={`grid grid-cols-1 gap-4 lg:grid-cols-2 ${dashboardView === 'projet' ? 'hidden' : ''}`}>
        {/* Top tâches en retard */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Tâches en retard</h3>
          {tachesEnRetardDetails.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune tâche en retard.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-400">
                    <th className="py-2 pr-3">Tâche</th>
                    <th className="py-2 pr-3">Projet</th>
                    <th className="py-2 pr-3">Priorité</th>
                    <th className="py-2 pr-3">Fin prév.</th>
                    <th className="py-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {tachesEnRetardDetails.map(t => {
                    const prio = normalizePriority(t.priorite);
                    const prioStyle: React.CSSProperties = prio === 'Bloquant'
                      ? { backgroundColor: '#fee2e2', color: '#b91c1c' }
                      : prio === 'Critique'
                      ? { backgroundColor: '#fef9c3', color: '#a16207' }
                      : { backgroundColor: '#dcfce7', color: '#15803d' };
                    const statutColor = STATUT_TACHE_COLOR[t.statut] ?? '#94a3b8';
                    return (
                      <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 pr-3 font-medium text-slate-700 max-w-[160px] truncate">{t.libelle}</td>
                        <td className="py-2 pr-3 text-slate-500 text-xs max-w-[120px] truncate">{t.projet?.libelle ?? '—'}</td>
                        <td className="py-2 pr-3">
                          <span className="rounded px-1.5 py-0.5 text-xs font-semibold" style={prioStyle}>{prio}</span>
                        </td>
                        <td className="py-2 pr-3 text-xs text-red-600 font-medium">
                          {t.dateFinPrevisionnelle ? new Date(t.dateFinPrevisionnelle).toLocaleDateString('fr-FR') : '—'}
                        </td>
                        <td className="py-2">
                          <span className="rounded px-1.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: statutColor }}>{t.statut}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top assignés */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Charge par assigné</h3>
          {topAssignes.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune assignation.</p>
          ) : (
            <div className="space-y-3">
              {topAssignes.map((a, i) => {
                const pctDone   = safePct(a.done, a.total);
                const pctRetard = safePct(a.retard, a.total);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 truncate max-w-[180px]">{a.name}</span>
                      <span className="text-slate-400 flex-shrink-0 ml-2">
                        {a.total} tâche{a.total > 1 ? 's' : ''}
                        {a.retard > 0 && <span className="ml-2 text-red-500">· {a.retard} en retard</span>}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
                      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pctDone}%` }} />
                      <div className="h-full bg-red-400 transition-all"     style={{ width: `${pctRetard}%` }} />
                    </div>
                    <div className="flex gap-3 text-[10px] text-slate-400">
                      <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" />Achevées {pctDone}%</span>
                      {pctRetard > 0 && <span><span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1" />Retard {pctRetard}%</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
