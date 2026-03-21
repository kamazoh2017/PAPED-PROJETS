'use client';

import { useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

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
}

interface Projet {
  id: string;
  libelle: string;
  statut: string;
  dateCreation: string;
  dateDebutPrevisionnelle?: string;
  dateFinPrevisionnelle?: string;
  dateFinEffective?: string;
  taches: Tache[];
  chefProjet?: { id: string; nom: string; prenoms: string };
}

const STATUTS_TACHES = ['À planifier', 'A faire', 'En cours', 'En attente', 'Terminé', 'Validé'];

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

function getRiskScoreBadgeClasses(score: number): string {
  const level = getRiskLevel(score);
  if (level === 'Critique') return 'bg-red-100 text-red-700';
  if (level === 'Élevé') return 'bg-orange-100 text-orange-700';
  if (level === 'Moyen') return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
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

function DistributionRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = safePct(value, total);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-slate-600 font-medium">
        <span>{label}</span>
        <span>{value} ({pct}%)</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
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
  const [dashboardView, setDashboardView] = useState<'projet' | 'taches'>('projet');

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
    () => projets.map((project) => ({ project, avancement: getProjectAvancement(project, nowTs) })),
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
    { name: 'Non démarrés', value: projectsNonDemarres, color: '#94a3b8' },
    { name: 'En cours',     value: projectsEnCours,    color: '#3b82f6' },
    { name: 'Terminés',     value: projectsTermines,   color: '#10b981' },
    { name: 'Clôturés',     value: projectsClotures,   color: '#0891b2' },
    { name: 'Suspendus',    value: projectsSuspendus,  color: '#7c3aed' },
  ];

  const avancementPieData = [
    { name: 'En retard',  value: projectsRetard,    color: '#ef4444' },
    { name: 'A l\'heure', value: projectsALHeure,   color: '#f59e0b' },
    { name: 'Hors délai', value: projectsHorsDelai, color: '#f97316' },
    { name: 'En avance',  value: projectsEnAvance,  color: '#22c55e' },
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

  // Graphique 2: Distribution des projets par achèvement
  const achievementData = useMemo(() => {
    const achieved = projets.filter((p) => p.statut === 'Terminé' || p.statut === 'Clôturé').length;
    const notAchieved = totalProjects - achieved;
    return [
      { name: 'Achevés', value: achieved, fill: '#10b981' },
      { name: 'Pas achevés', value: notAchieved, fill: '#94a3b8' },
    ];
  }, [projets, totalProjects]);

  // Graphique 3: Charge par chef de projet (barres empilées)
  const chargeChefProjet = useMemo(() => {
    const map = new Map<string, { name: string; 'A l\'heure': number; 'En retard': number; 'Hors délais': number }>();
    projets.forEach((p) => {
      if (!p.chefProjet?.id) return;
      const id = p.chefProjet.id;
      const name = `${p.chefProjet.prenoms} ${p.chefProjet.nom}`;
      const current = map.get(id) ?? { name, 'A l\'heure': 0, 'En retard': 0, 'Hors délais': 0 };
      const av = projectAvancement.find((pa) => pa.project.id === p.id)?.avancement;
      if (av === 'en-avance' || av === 'a-lheure') current['A l\'heure'] += 1;
      else if (av === 'retard') current['En retard'] += 1;
      else if (av === 'hors-delai') current['Hors délais'] += 1;
      map.set(id, current);
    });
    return Array.from(map.values()).sort((a, b) => (b['A l\'heure'] + b['En retard'] + b['Hors délais']) - (a['A l\'heure'] + a['En retard'] + a['Hors délais'])).slice(0, 10);
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

  const tasksByStatus = STATUTS_TACHES.map((status) => ({ status, value: filteredTaches.filter((t) => t.statut === status).length }));
  const tasksByPriority = [
    { label: 'Bloquant', value: filteredTaches.filter((t) => normalizePriority(t.priorite) === 'Bloquant').length, color: 'bg-red-500' },
    { label: 'Critique', value: filteredTaches.filter((t) => normalizePriority(t.priorite) === 'Critique').length, color: 'bg-amber-500' },
    { label: 'Normal', value: filteredTaches.filter((t) => normalizePriority(t.priorite) === 'Normal').length, color: 'bg-green-500' },
  ];

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
          <MetricCard title="Total projets" value={totalProjects} compact />
          <MetricCard title="Trermines" value={projectsTermines} rightValue={`${pctProjectsTermines}%`} tone="text-emerald-600" compact />
          <MetricCard title="Clotures" value={projectsClotures} rightValue={`${pctProjectsClotures}%`} tone="text-cyan-700" compact />
          <MetricCard title="% achevement" value={`${tauxAchevement}%`} tone="text-emerald-600" compact />
          <MetricCard title="En cours" value={projectsEnCours} rightValue={`${pctProjectsEnCours}%`} tone="text-blue-600" compact />
          <MetricCard title="% Progression" value={`${tauxProgressionGlobal}%`} tone="text-blue-600" compact />
          <MetricCard title="En retard" value={projectsRetard} rightValue={`${pctProjectsRetard}%`} tone="text-red-600" compact />
          <MetricCard title="Hors delais" value={projectsHorsDelai} rightValue={`${pctProjectsHorsDelai}%`} tone="text-orange-600" compact />
          <MetricCard title="Non demarres" value={projectsNonDemarres} rightValue={`${pctProjectsNonDemarres}%`} tone="text-slate-700" compact />
          <MetricCard title="Suspendus" value={projectsSuspendus} rightValue={`${pctProjectsSuspendus}%`} tone="text-violet-700" compact />
        </div>
      </section>

      <section className={`grid grid-cols-1 gap-4 lg:grid-cols-3 ${dashboardView === 'taches' ? 'hidden' : ''}`}>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-2">Répartition par statut</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
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
            <BarChart data={achievementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-2">Avancement (délais)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={avancementPieData} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={84} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [v, 'projets']} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {avancementPieData.map((entry) => (
                  <Cell key={`a-${entry.name}`} fill={entry.color} />
                ))}
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
              <Line type="monotone" dataKey="reel" stroke="#3b82f6" name="Progression réelle" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="attendu" stroke="#94a3b8" name="Progression attendue" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Distribution par avancement (%)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={progressionByRange}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis label={{ value: 'Nombre de projets', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className={`grid grid-cols-1 gap-4 lg:grid-cols-3 ${dashboardView === 'taches' ? 'hidden' : ''}`}>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-3">Charge par chef de projet</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chargeChefProjet} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="A l'heure" stackId="a" fill="#22c55e" />
              <Bar dataKey="En retard" stackId="a" fill="#ef4444" />
              <Bar dataKey="Hors délais" stackId="a" fill="#f97316" />
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
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="retard" name="Retard" stackId="risk" fill="#ef4444" radius={[0, 0, 0, 0]} />
              <Bar dataKey="horsDelai" name="Hors délai" stackId="risk" fill="#f97316" radius={[0, 0, 0, 0]} />
              <Bar dataKey="progression" name="Progression" stackId="risk" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="suspendu" name="Suspendu" stackId="risk" fill="#7c3aed" radius={[8, 8, 0, 0]} />
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
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${getRiskScoreBadgeClasses(risk.global)}`}>{risk.global}%</span>
                    </td>
                    <td className="py-2 pr-3">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${getRiskScoreBadgeClasses(risk.retard)}`}>{risk.retard}%</span>
                    </td>
                    <td className="py-2 pr-3">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${getRiskScoreBadgeClasses(risk.horsDelai)}`}>{risk.horsDelai}%</span>
                    </td>
                    <td className="py-2 pr-3">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${getRiskScoreBadgeClasses(risk.progression)}`}>{risk.progression}%</span>
                    </td>
                    <td className="py-2 pr-3">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${getRiskScoreBadgeClasses(risk.suspendu)}`}>{risk.suspendu}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={`grid grid-cols-1 gap-4 lg:grid-cols-2 ${dashboardView === 'projet' ? 'hidden' : ''}`}>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <h3 className="text-lg font-semibold text-slate-800">Flux des taches</h3>
          {tasksByStatus.map((item) => (
            <DistributionRow key={item.status} label={item.status} value={item.value} total={filteredTaches.length} color="bg-secondary" />
          ))}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <h3 className="text-lg font-semibold text-slate-800">Poids par priorite</h3>
          {tasksByPriority.map((item) => (
            <DistributionRow key={item.label} label={item.label} value={item.value} total={filteredTaches.length} color={item.color} />
          ))}
        </div>
      </section>
    </div>
  );
}
