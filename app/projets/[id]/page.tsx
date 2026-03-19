'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Users, Building2, CheckCircle2, Plus, X, User } from 'lucide-react';
import ProjectGantt from '@/components/ProjectGantt';

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
  telephone?: string;
  entite: Entite;
}

interface Tache {
  id: string;
  libelle: string;
  description?: string;
  priorite: string;
  statut: string;
  dateCreation: string;
  dateDebutPrevisionnelle?: string;
  dateFinPrevisionnelle?: string;
  dateDebutEffective?: string;
  dateFinEffective?: string;
  assigneAId?: string;
  assigneA?: Personne;
}

interface PartiePrenante {
  id: string;
  libelle: string;
  type: string;
  entite?: Entite;
  responsable?: Personne;
}

interface PartiePrenanteProjets {
  id: string;
  partiePrenante: PartiePrenante;
}

interface Projet {
  id: string;
  libelle: string;
  description?: string;
  statut: string;
  dateDebutPrevisionnelle?: string;
  dateFinPrevisionnelle?: string;
  chefProjet: Personne;
  equipeProjet: Personne[];
  taches: Tache[];
  partiesPrenantes: PartiePrenanteProjets[];
}

const PRIORITE_COLORS: Record<string, string> = {
  Haute: 'bg-red-100 text-red-700 border-red-200',
  Moyenne: 'bg-amber-100 text-amber-700 border-amber-200',
  Basse: 'bg-green-100 text-green-700 border-green-200',
};

const PRIORITE_CARD_BG: Record<string, string> = {
  Haute: 'bg-red-50',
  Moyenne: 'bg-amber-50',
  Basse: 'bg-green-50',
};

const AVANCEMENT_BORDER_LEFT: Record<'retard' | 'a-jour' | 'en-avance', string> = {
  retard: 'border-l-red-500',
  'a-jour': 'border-l-white',
  'en-avance': 'border-l-green-500',
};

const AVANCEMENT_BADGE: Record<'retard' | 'a-jour' | 'en-avance', { label: string; classes: string }> = {
  retard:      { label: 'En retard',  classes: 'bg-red-100 text-red-700' },
  'a-jour':    { label: 'À jour',     classes: 'bg-blue-100 text-blue-700' },
  'en-avance': { label: 'En avance',  classes: 'bg-green-100 text-green-700' },
};

function getAvanancementProjet(statut: string, dateDebutPrev?: string, dateFinPrev?: string): 'retard' | 'a-jour' | 'en-avance' | null {
  const STATUTS_TERMINAUX = ['Terminé', 'Réceptionné', 'Clôturé'];
  const STATUTS_ACTIFS = ['Demarrage', 'En cours'];
  if (!STATUTS_ACTIFS.includes(statut) && !STATUTS_TERMINAUX.includes(statut)) return null;

  const now = Date.now();
  const fin = dateFinPrev ? new Date(dateFinPrev).getTime() : null;
  const debut = dateDebutPrev ? new Date(dateDebutPrev).getTime() : null;

  if (STATUTS_TERMINAUX.includes(statut)) {
    if (fin && fin > now) return 'en-avance';
    return 'a-jour';
  }
  if (fin && fin < now) return 'retard';
  if (debut && debut < now && statut === 'Demarrage') return 'retard';
  return 'a-jour';
}

const STATUT_COLORS: Record<string, string> = {
  Backlog: 'bg-slate-100 text-slate-600',
  'A faire': 'bg-blue-100 text-blue-700',
  'En cours': 'bg-amber-100 text-amber-700',
  Terminé: 'bg-green-100 text-green-700',
  Validé: 'bg-emerald-100 text-emerald-700',
};

const KANBAN_COLUMNS = ['A faire', 'En cours', 'Terminé', 'Validé'] as const;

const KANBAN_CONFIG: Record<string, { label: string; borderColor: string; headerClass: string }> = {
  'A faire':  { label: 'À faire',  borderColor: 'border-t-blue-400',    headerClass: 'bg-blue-50 text-blue-700' },
  'En cours': { label: 'En cours', borderColor: 'border-t-amber-400',   headerClass: 'bg-amber-50 text-amber-700' },
  'Terminé':  { label: 'Terminé',  borderColor: 'border-t-green-400',   headerClass: 'bg-green-50 text-green-700' },
  'Validé':   { label: 'Validé',   borderColor: 'border-t-emerald-500', headerClass: 'bg-emerald-50 text-emerald-700' },
};

type TabKey = 'infos' | 'backlog' | 'execution' | 'gantt';

export default function ProjetDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [projet, setProjet] = useState<Projet | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('infos');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFormError, setTaskFormError] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetCol, setDropTargetCol] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({
    libelle: '',
    description: '',
    priorite: 'Moyenne',
    assigneAId: '',
    dateDebutPrevisionnelle: '',
    dateFinPrevisionnelle: '',
  });

  useEffect(() => {
    if (projectId) fetchProjet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchProjet = async () => {
    try {
      const res = await fetch(`/api/projets/${projectId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && !data.error) setProjet(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskFormError('');
    try {
      const res = await fetch('/api/taches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projetId: projectId, ...taskForm }),
      });
      if (!res.ok) {
        const payload = await res.json();
        setTaskFormError(payload?.error || 'Erreur lors de la création de la tâche.');
        return;
      }
      await fetchProjet();
      setTaskForm({ libelle: '', description: '', priorite: 'Moyenne', assigneAId: '', dateDebutPrevisionnelle: '', dateFinPrevisionnelle: '' });
      setShowTaskForm(false);
    } catch {
      setTaskFormError('Erreur réseau.');
    }
  };

  const moveTask = async (taskId: string, newStatut: string) => {
    try {
      await fetch(`/api/taches/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut }),
      });
      await fetchProjet();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Chargement...</div>;
  if (!projet) return <div className="text-center py-16 text-slate-400">Projet non trouvé</div>;

  // Progression calculations
  const taches = projet.taches ?? [];
  const totalTaches = taches.length;
  const previsionnel = totalTaches === 0 ? 0
    : Math.round(taches.filter(t => t.statut !== 'Backlog').length / totalTaches * 100);
  const effectif = totalTaches === 0 ? 0
    : Math.round(taches.filter(t => t.statut === 'Terminé' || t.statut === 'Validé').length / totalTaches * 100);

  const avancementProjet = getAvanancementProjet(projet.statut, projet.dateDebutPrevisionnelle, projet.dateFinPrevisionnelle);
  const avBadge = avancementProjet ? AVANCEMENT_BADGE[avancementProjet] : null;

  // Unique entities from team members
  const entiteMap = new Map<string, Entite>();
  projet.equipeProjet.forEach(m => { if (m.entite?.id) entiteMap.set(m.entite.id, m.entite); });
  const entites = Array.from(entiteMap.values());

  const tasksByMember = (memberId: string) =>
    taches.filter(t => t.assigneA?.id === memberId);

  const tasksByColumn = (col: string) =>
    taches.filter(t => t.statut === col);

  const getAvancement = (task: Tache): 'retard' | 'a-jour' | 'en-avance' => {
    const isTerminee = task.statut === 'Terminé' || task.statut === 'Validé';
    const dateFinPrevue = task.dateFinPrevisionnelle ? new Date(task.dateFinPrevisionnelle) : null;
    const dateFinEffective = task.dateFinEffective ? new Date(task.dateFinEffective) : null;

    // En avance: tache terminee avant la date de fin previsionnelle.
    if (isTerminee && dateFinPrevue && dateFinEffective && dateFinEffective.getTime() < dateFinPrevue.getTime()) {
      return 'en-avance';
    }

    // Retard: date de fin previsionnelle depassee sur une tache non terminee.
    if (!isTerminee && dateFinPrevue && dateFinPrevue.getTime() < Date.now()) {
      return 'retard';
    }

    return 'a-jour';
  };

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'infos',     label: 'Informations générales' },
    { key: 'backlog',   label: 'Backlog' },
    { key: 'execution', label: 'Exécution' },
    { key: 'gantt',     label: 'Gantt' },
  ];

  return (
    <div className="space-y-6">

      {/* ── HEADER ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">{projet.libelle}</h1>
            {projet.description && (
              <p className="mt-1 text-slate-500 text-sm">{projet.description}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                {projet.statut}
              </span>
              {avBadge && (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${avBadge.classes}`}>
                  {avBadge.label}
                </span>
              )}
              <span className="flex items-center gap-1 text-slate-600 text-sm">
                <Users size={14} />
                {projet.equipeProjet.length} membre{projet.equipeProjet.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1 text-slate-600 text-sm">
                <CheckCircle2 size={14} />
                {totalTaches} tâche{totalTaches !== 1 ? 's' : ''}
              </span>
            </div>
            {(projet.dateDebutPrevisionnelle || projet.dateFinPrevisionnelle) && (
              <div className="flex flex-wrap gap-3 mt-2">
                {projet.dateDebutPrevisionnelle && (
                  <span className="text-xs text-slate-400">
                    Début prév. {new Date(projet.dateDebutPrevisionnelle).toLocaleDateString('fr-FR')}
                  </span>
                )}
                {projet.dateFinPrevisionnelle && (
                  <span className="text-xs text-slate-400">
                    Fin prév. {new Date(projet.dateFinPrevisionnelle).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Progression bars */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Progression prévisionnelle</span>
              <span className="font-bold text-primary">{previsionnel}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${previsionnel}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Progression effective</span>
              <span className="font-bold text-secondary">{effectif}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all duration-500"
                style={{ width: `${effectif}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1" role="tablist">
          {TABS.map(tab => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── TAB: INFORMATIONS GÉNÉRALES ── */}
      {activeTab === 'infos' && (
        <div className="space-y-6">

          {/* Chef de projet */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
              <User size={17} /> Chef de projet
            </h2>
            {projet.chefProjet ? (
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                  {projet.chefProjet.prenoms?.[0]}{projet.chefProjet.nom?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{projet.chefProjet.prenoms} {projet.chefProjet.nom}</p>
                  <p className="text-sm text-slate-500">{projet.chefProjet.fonction}</p>
                  <p className="text-xs text-slate-400">{projet.chefProjet.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">Aucun chef de projet désigné</p>
            )}
          </section>

          {/* Entités */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
              <Building2 size={17} /> Entités impliquées
            </h2>
            {entites.length === 0 ? (
              <p className="text-slate-400 text-sm">Aucune entité</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {entites.map(e => (
                  <span key={e.id} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                    {e.libelle}
                    {e.tutelle && <span className="text-slate-400 ml-1 font-normal">· {e.tutelle}</span>}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Équipe et tâches */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
              <Users size={17} /> Membres de l&apos;équipe
            </h2>
            {projet.equipeProjet.length === 0 ? (
              <p className="text-slate-400 text-sm">Aucun membre</p>
            ) : (
              <div className="space-y-3">
                {projet.equipeProjet.map(membre => {
                  const memberTasks = tasksByMember(membre.id);
                  return (
                    <div key={membre.id} className="border border-slate-100 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-semibold text-sm shrink-0">
                          {membre.prenoms?.[0]}{membre.nom?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm">{membre.prenoms} {membre.nom}</p>
                          <p className="text-xs text-slate-500">{membre.fonction}{membre.entite ? ` · ${membre.entite.libelle}` : ''}</p>
                        </div>
                        <span className="ml-auto text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full shrink-0">
                          {memberTasks.length} tâche{memberTasks.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {memberTasks.length > 0 && (
                        <div className="mt-3 space-y-1.5 pl-12">
                          {memberTasks.map(t => (
                            <div key={t.id} className="flex items-center justify-between gap-2 text-xs">
                              <span className="text-slate-600 truncate">{t.libelle}</span>
                              <div className="flex gap-1.5 shrink-0">
                                <span className={`px-2 py-0.5 rounded-full border ${PRIORITE_COLORS[t.priorite] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                  {t.priorite}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full ${STATUT_COLORS[t.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                                  {t.statut}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Registre parties prenantes */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-base font-bold text-primary mb-4">Registre des parties prenantes</h2>
            {projet.partiesPrenantes.length === 0 ? (
              <p className="text-slate-400 text-sm">Aucune partie prenante enregistrée</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-100">
                      <th className="text-left py-2.5 px-4 font-semibold">Libellé</th>
                      <th className="text-left py-2.5 px-4 font-semibold">Type</th>
                      <th className="text-left py-2.5 px-4 font-semibold">Entité</th>
                      <th className="text-left py-2.5 px-4 font-semibold">Responsable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {projet.partiesPrenantes.map(pp => (
                      <tr key={pp.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-medium text-slate-800">{pp.partiePrenante.libelle}</td>
                        <td className="py-2.5 px-4 text-slate-600">{pp.partiePrenante.type}</td>
                        <td className="py-2.5 px-4 text-slate-500">{pp.partiePrenante.entite?.libelle ?? '—'}</td>
                        <td className="py-2.5 px-4 text-slate-500">
                          {pp.partiePrenante.responsable
                            ? `${pp.partiePrenante.responsable.prenoms} ${pp.partiePrenante.responsable.nom}`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── TAB: BACKLOG ── */}
      {activeTab === 'backlog' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary">Liste des tâches</h2>
            <button
              onClick={() => { setShowTaskForm(v => !v); setTaskFormError(''); }}
              className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              {showTaskForm ? <X size={15} /> : <Plus size={15} />}
              {showTaskForm ? 'Annuler' : 'Nouvelle tâche'}
            </button>
          </div>

          {showTaskForm && (
            <form onSubmit={handleTaskSubmit} className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold text-slate-700 text-sm">Créer une tâche</h3>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Libellé *</label>
                <input
                  type="text"
                  required
                  value={taskForm.libelle}
                  onChange={e => setTaskForm(f => ({ ...f, libelle: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Priorité</label>
                  <select
                    value={taskForm.priorite}
                    onChange={e => setTaskForm(f => ({ ...f, priorite: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option>Haute</option>
                    <option>Moyenne</option>
                    <option>Basse</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Assigner à</label>
                  <select
                    value={taskForm.assigneAId}
                    onChange={e => setTaskForm(f => ({ ...f, assigneAId: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="">— Backlog (non assigné) —</option>
                    {projet.equipeProjet.map(m => (
                      <option key={m.id} value={m.id}>{m.prenoms} {m.nom}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Début prévisionnel</label>
                  <input
                    type="date"
                    value={taskForm.dateDebutPrevisionnelle}
                    onChange={e => setTaskForm(f => ({ ...f, dateDebutPrevisionnelle: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fin prévisionnelle</label>
                  <input
                    type="date"
                    value={taskForm.dateFinPrevisionnelle}
                    onChange={e => setTaskForm(f => ({ ...f, dateFinPrevisionnelle: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              {taskForm.assigneAId ? (
                <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                  Cette tâche sera créée avec le statut <strong>À faire</strong>.
                </p>
              ) : (
                <p className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">
                  Sans assignation, la tâche sera créée avec le statut <strong>Backlog</strong>.
                </p>
              )}

              {taskFormError && <p className="text-xs text-red-600">{taskFormError}</p>}

              <button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-semibold"
              >
                Créer la tâche
              </button>
            </form>
          )}

          {/* Task list table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {taches.length === 0 ? (
              <div className="py-14 text-center text-slate-400 text-sm">
                Aucune tâche créée. Cliquez sur &quot;Nouvelle tâche&quot; pour commencer.
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                    <th className="text-left py-3 px-4 font-semibold">Tâche</th>
                    <th className="text-left py-3 px-4 font-semibold">Priorité</th>
                    <th className="text-left py-3 px-4 font-semibold">Statut</th>
                    <th className="text-left py-3 px-4 font-semibold">Assigné à</th>
                    <th className="text-left py-3 px-4 font-semibold">Dates prév.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {taches.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{t.libelle}</p>
                        {t.description && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{t.description}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITE_COLORS[t.priorite] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {t.priorite}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUT_COLORS[t.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                          {t.statut}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {t.assigneA
                          ? `${t.assigneA.prenoms} ${t.assigneA.nom}`
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">
                        {t.dateDebutPrevisionnelle
                          ? new Date(t.dateDebutPrevisionnelle).toLocaleDateString('fr-FR')
                          : '—'}
                        {' → '}
                        {t.dateFinPrevisionnelle
                          ? new Date(t.dateFinPrevisionnelle).toLocaleDateString('fr-FR')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: EXÉCUTION (KANBAN) ── */}
      {activeTab === 'execution' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-primary">Tableau d&apos;exécution</h2>
          <p className="text-xs text-slate-400">Glissez-déposez les tickets pour changer leur statut.</p>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {KANBAN_COLUMNS.map(col => {
              const cfg = KANBAN_CONFIG[col];
              const tasks = tasksByColumn(col);
              const isOver = dropTargetCol === col;
              return (
                <div
                  key={col}
                  className={`flex-shrink-0 w-60 bg-white rounded-2xl border border-slate-200 border-t-4 ${cfg.borderColor} shadow-sm flex flex-col`}
                  onDragOver={e => { e.preventDefault(); setDropTargetCol(col); }}
                  onDragLeave={e => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTargetCol(null);
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    if (draggedTaskId) moveTask(draggedTaskId, col);
                    setDraggedTaskId(null);
                    setDropTargetCol(null);
                  }}
                >
                  <div className={`px-4 py-3 rounded-t-xl flex items-center justify-between ${cfg.headerClass}`}>
                    <h3 className="font-semibold text-sm">{cfg.label}</h3>
                    <span className="text-xs font-bold bg-white/60 px-2 py-0.5 rounded-full">{tasks.length}</span>
                  </div>
                  <div
                    className={`p-2.5 space-y-2 min-h-[180px] flex-1 rounded-b-2xl transition-colors ${
                      isOver ? 'bg-slate-50 ring-2 ring-inset ring-slate-300' : ''
                    }`}
                  >
                    {tasks.map(task => {
                      const avancement = getAvancement(task);
                      const priorityBg = PRIORITE_CARD_BG[task.priorite] ?? 'bg-slate-50';
                      const avancementBorder = AVANCEMENT_BORDER_LEFT[avancement];
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => setDraggedTaskId(task.id)}
                          onDragEnd={() => { setDraggedTaskId(null); setDropTargetCol(null); }}
                          className={`rounded-xl p-3 border-l-4 cursor-grab active:cursor-grabbing shadow-sm select-none transition-opacity ${
                            priorityBg
                          } ${
                            avancementBorder
                          } ${
                            draggedTaskId === task.id ? 'opacity-30' : 'opacity-100'
                          }`}
                        >
                          <p className="font-semibold text-slate-800 text-sm leading-snug">{task.libelle}</p>
                          {task.assigneA && (
                            <p className="text-xs text-slate-500 mt-1.5 truncate">
                              {task.assigneA.prenoms} {task.assigneA.nom}
                            </p>
                          )}
                        </div>
                      );
                    })}
                    {tasks.length === 0 && (
                      <div
                        className={`flex items-center justify-center h-20 text-xs rounded-xl border-2 border-dashed transition-colors ${
                          isOver ? 'border-slate-400 text-slate-400' : 'border-slate-100 text-slate-300'
                        }`}
                      >
                        {isOver ? 'Déposer ici' : 'Aucune tâche'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: GANTT ── */}
      {activeTab === 'gantt' && (
        <ProjectGantt tasks={taches} title="Diagramme de Gantt des tâches" />
      )}
    </div>
  );
}
