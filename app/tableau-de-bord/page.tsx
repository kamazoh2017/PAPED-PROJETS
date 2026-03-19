'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Avancement = 'retard' | 'a-jour' | 'en-avance';

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
  taches: Tache[];
}

const STATUTS_TACHES = ['Backlog', 'A faire', 'En cours', 'En attente', 'Bloqué', 'Terminé', 'A valider', 'Validé'];
const STATUTS_PROJETS = ['Demarrage', 'En cours', 'Terminé', 'Réceptionné', 'Clôturé'];

const AVANCEMENT_BADGE: Record<Avancement, { label: string; classes: string }> = {
  retard: { label: 'En retard', classes: 'bg-red-100 text-red-700' },
  'a-jour': { label: 'A jour', classes: 'bg-blue-100 text-blue-700' },
  'en-avance': { label: 'En avance', classes: 'bg-green-100 text-green-700' },
};

function parseDate(value?: string): number | null {
  if (!value) return null;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? null : ts;
}

function getTaskAvancement(task: Tache, nowTs: number): Avancement {
  const isDone = task.statut === 'Terminé' || task.statut === 'Validé';
  const finPrev = parseDate(task.dateFinPrevisionnelle);
  const finEff = parseDate(task.dateFinEffective);

  if (isDone && finPrev && finEff && finEff < finPrev) return 'en-avance';
  if (!isDone && finPrev && finPrev < nowTs) return 'retard';
  return 'a-jour';
}

function getProjectAvancement(project: Projet, nowTs: number): Avancement | null {
  const terminal = ['Terminé', 'Réceptionné', 'Clôturé'];
  const actifs = ['Demarrage', 'En cours'];
  const finPrev = parseDate(project.dateFinPrevisionnelle);
  const debutPrev = parseDate(project.dateDebutPrevisionnelle);

  if (!terminal.includes(project.statut) && !actifs.includes(project.statut)) return null;
  if (terminal.includes(project.statut)) {
    if (finPrev && finPrev > nowTs) return 'en-avance';
    return 'a-jour';
  }
  if (finPrev && finPrev < nowTs) return 'retard';
  if (debutPrev && debutPrev < nowTs && project.statut === 'Demarrage') return 'retard';
  return 'a-jour';
}

function daysDeltaFromNow(value?: string): number | null {
  const ts = parseDate(value);
  if (!ts) return null;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.ceil((ts - Date.now()) / oneDay);
}

function safePct(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function MetricCard({ title, value, subtitle, tone = 'text-primary' }: { title: string; value: string | number; subtitle?: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ fontFamily: 'Sora, ui-sans-serif' }}>
      <p className="text-[11px] text-slate-500 uppercase tracking-[0.12em]">{title}</p>
      <p className={`text-3xl font-semibold mt-1 ${tone}`}>{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{subtitle}</p>}
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
  const [lastUpdatedAt, setLastUpdatedAt] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [proRes, tRes] = await Promise.all([fetch('/api/projets'), fetch('/api/taches')]);
        const projetsData = await proRes.json();
        const tachesData = await tRes.json();
        setProjets(Array.isArray(projetsData) ? projetsData : []);
        setTaches(Array.isArray(tachesData) ? tachesData : []);
        setLastUpdatedAt(new Date().toLocaleString('fr-FR'));
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  const taskAvancement = useMemo(
    () => filteredTaches.map((task) => ({ task, avancement: getTaskAvancement(task, nowTs) })),
    [filteredTaches, nowTs]
  );

  const projectAvancement = useMemo(
    () => projets.map((project) => ({ project, avancement: getProjectAvancement(project, nowTs) })),
    [projets, nowTs]
  );

  const projectsActifs = projets.filter((p) => ['Demarrage', 'En cours'].includes(p.statut)).length;
  const projectsRetard = projectAvancement.filter((p) => p.avancement === 'retard').length;
  const projectsEnAvance = projectAvancement.filter((p) => p.avancement === 'en-avance').length;
  const projectDelayRate = safePct(projectsRetard, projectsActifs);

  const tasksRetard = taskAvancement.filter((t) => t.avancement === 'retard').length;
  const tasksDone = filteredTaches.filter((t) => t.statut === 'Terminé' || t.statut === 'Validé').length;
  const taskDoneRate = safePct(tasksDone, filteredTaches.length);
  const tasksHighRetard = taskAvancement.filter((t) => t.task.priorite === 'Haute' && t.avancement === 'retard').length;

  const projectsByStatus = STATUTS_PROJETS.map((s) => ({ status: s, value: projets.filter((p) => p.statut === s).length }));
  const projectsByAvancement = [
    { label: 'En retard', key: 'retard' as Avancement, value: projectAvancement.filter((p) => p.avancement === 'retard').length },
    { label: 'A jour', key: 'a-jour' as Avancement, value: projectAvancement.filter((p) => p.avancement === 'a-jour').length },
    { label: 'En avance', key: 'en-avance' as Avancement, value: projectAvancement.filter((p) => p.avancement === 'en-avance').length },
  ];

  const tasksByStatus = STATUTS_TACHES.map((status) => ({ status, value: filteredTaches.filter((t) => t.statut === status).length }));
  const tasksByPriority = [
    { label: 'Haute', value: filteredTaches.filter((t) => t.priorite === 'Haute').length, color: 'bg-red-500' },
    { label: 'Moyenne', value: filteredTaches.filter((t) => t.priorite === 'Moyenne').length, color: 'bg-amber-500' },
    { label: 'Basse', value: filteredTaches.filter((t) => t.priorite === 'Basse').length, color: 'bg-green-500' },
  ];

  const topRiskProjects = useMemo(() => {
    return projets
      .map((project) => {
        const avancement = getProjectAvancement(project, nowTs);
        const delta = daysDeltaFromNow(project.dateFinPrevisionnelle);
        const total = project.taches?.length ?? 0;
        const done = project.taches?.filter((t) => t.statut === 'Terminé' || t.statut === 'Validé').length ?? 0;
        const progress = safePct(done, total);
        return { project, avancement, delta, progress };
      })
      .filter((row) => row.avancement === 'retard' || row.project.statut === 'En cours')
      .sort((a, b) => {
        const aScore = a.delta === null ? 9999 : a.delta;
        const bScore = b.delta === null ? 9999 : b.delta;
        return aScore - bScore;
      })
      .slice(0, 10);
  }, [projets, nowTs]);

  const resourceLoad = useMemo(() => {
    const map = new Map<string, { name: string; active: number; retard: number }>();
    filteredTaches.forEach((t) => {
      if (!t.assigneA?.id) return;
      const id = t.assigneA.id;
      const name = `${t.assigneA.prenoms} ${t.assigneA.nom}`;
      const current = map.get(id) || { name, active: 0, retard: 0 };
      if (!['Terminé', 'Validé'].includes(t.statut)) current.active += 1;
      if (getTaskAvancement(t, nowTs) === 'retard') current.retard += 1;
      map.set(id, current);
    });
    return Array.from(map.values()).sort((a, b) => b.active - a.active).slice(0, 8);
  }, [filteredTaches, nowTs]);

  const alerts = useMemo(() => {
    const list: string[] = [];
    const overdueProjects = topRiskProjects.filter((r) => r.delta !== null && r.delta < 0).length;
    if (overdueProjects > 0) list.push(`${overdueProjects} projet(s) avec date de fin previsionnelle depassee.`);
    if (tasksHighRetard > 0) list.push(`${tasksHighRetard} tache(s) haute priorite en retard.`);
    const noDeadlineProjects = projets.filter((p) => !p.dateFinPrevisionnelle && ['Demarrage', 'En cours'].includes(p.statut)).length;
    if (noDeadlineProjects > 0) list.push(`${noDeadlineProjects} projet(s) actif(s) sans date de fin previsionnelle.`);
    const unassignedHigh = filteredTaches.filter((t) => t.priorite === 'Haute' && !t.assigneA).length;
    if (unassignedHigh > 0) list.push(`${unassignedHigh} tache(s) haute priorite non assignee(s).`);
    return list.slice(0, 8);
  }, [topRiskProjects, tasksHighRetard, projets, filteredTaches]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500" style={{ fontFamily: 'Sora, ui-sans-serif' }}>
        Chargement du dashboard global...
      </div>
    );
  }

  return (
    <div className="space-y-7" style={{ fontFamily: 'Sora, ui-sans-serif' }}>
      <div className="flex items-center justify-end">
        <span className="text-xs text-slate-400">Derniere mise a jour: {lastUpdatedAt || 'n/a'}</span>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Filtrer par projet</label>
            <select value={filterProjet} onChange={(e) => setFilterProjet(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="">Tous les projets</option>
              {projets.map((p) => (
                <option key={p.id} value={p.id}>{p.libelle}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Filtrer par statut tache</label>
            <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="">Tous les statuts</option>
              {STATUTS_TACHES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => { setFilterProjet(''); setFilterStatut(''); }} className="w-full rounded-lg bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700">
              Reinitialiser les filtres
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-800">KPI Executifs</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Projets actifs" value={projectsActifs} />
          <MetricCard title="Projets en retard" value={projectsRetard} tone="text-red-600" />
          <MetricCard title="Projets en avance" value={projectsEnAvance} tone="text-green-600" />
          <MetricCard title="Taux retard projet" value={`${projectDelayRate}%`} subtitle="sur projets actifs" tone="text-red-600" />
          <MetricCard title="Taches totales" value={filteredTaches.length} />
          <MetricCard title="Taches en retard" value={tasksRetard} tone="text-red-600" />
          <MetricCard title="Taux achevement" value={`${taskDoneRate}%`} subtitle="Termine + Valide" tone="text-green-600" />
          <MetricCard title="Haute priorite en retard" value={tasksHighRetard} tone="text-amber-600" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-7">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <h3 className="text-lg font-semibold text-slate-800">Sante du portefeuille</h3>
              {projectsByStatus.map((item) => (
                <DistributionRow key={item.status} label={item.status} value={item.value} total={projets.length} color="bg-primary" />
              ))}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <h3 className="text-lg font-semibold text-slate-800">Avancement projets</h3>
              {projectsByAvancement.map((item) => (
                <DistributionRow
                  key={item.key}
                  label={item.label}
                  value={item.value}
                  total={projets.length}
                  color={item.key === 'retard' ? 'bg-red-500' : item.key === 'en-avance' ? 'bg-green-500' : 'bg-blue-500'}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
          </div>
        </div>

        <div className="space-y-4 xl:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Alertes actionnables</h3>
            {alerts.length === 0 ? (
              <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">Aucune alerte critique detectee.</p>
            ) : (
              <ul className="space-y-2">
                {alerts.map((alert, idx) => (
                  <li key={`${alert}-${idx}`} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {alert}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Charge par ressource</h3>
            {resourceLoad.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune ressource assignee sur les filtres actuels.</p>
            ) : (
              <div className="space-y-3">
                {resourceLoad.map((r) => (
                  <div key={r.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700">{r.name}</span>
                      <span className="text-slate-500">{r.active} actives / {r.retard} retard</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-2.5 rounded-full bg-primary" style={{ width: `${Math.min(100, r.active * 10)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Top projets a risque</h2>
        {topRiskProjects.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun projet risque detecte avec les filtres actuels.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-4">Projet</th>
                  <th className="py-2 pr-4">Statut</th>
                  <th className="py-2 pr-4">Avancement</th>
                  <th className="py-2 pr-4">Fin prev.</th>
                  <th className="py-2 pr-4">Delta (jours)</th>
                  <th className="py-2 pr-4">Progression</th>
                  <th className="py-2 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {topRiskProjects.map((row) => (
                  <tr key={row.project.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-semibold text-slate-700">{row.project.libelle}</td>
                    <td className="py-2 pr-4">{row.project.statut}</td>
                    <td className="py-2 pr-4">
                      {row.avancement && (
                        <span className={`rounded px-2 py-1 text-xs ${AVANCEMENT_BADGE[row.avancement].classes}`}>
                          {AVANCEMENT_BADGE[row.avancement].label}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-slate-500">
                      {row.project.dateFinPrevisionnelle ? new Date(row.project.dateFinPrevisionnelle).toLocaleDateString('fr-FR') : 'Non definie'}
                    </td>
                    <td className={`py-2 pr-4 font-semibold ${row.delta !== null && row.delta < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {row.delta === null ? '-' : row.delta}
                    </td>
                    <td className="py-2 pr-4">{row.progress}%</td>
                    <td className="py-2 pr-4">
                      <Link href={`/projets/${row.project.id}`} className="font-medium text-primary hover:underline">Detail</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
