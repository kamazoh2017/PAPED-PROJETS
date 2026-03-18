'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Tache {
  id: string;
  libelle: string;
  description?: string;
  priorite: string;
  statut: string;
  dateCreation: string;
  dateFinPrevisionnelle?: string;
  assigneA?: { nom: string; prenoms: string };
}

interface Projet {
  id: string;
  libelle: string;
  description?: string;
  statut: string;
  chefProjet?: { nom: string; prenoms: string };
  equipeProjet: any[];
  taches: Tache[];
}

const STATUTS = ['Backlog', 'A faire', 'En cours', 'En attente', 'Bloqué', 'Terminé', 'A valider', 'Validé'];

export default function ProjetDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [projet, setProjet] = useState<Projet | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFormError, setTaskFormError] = useState('');
  const [formData, setFormData] = useState({
    libelle: '',
    description: '',
    priorite: 'Moyenne',
    dateFinPrevisionnelle: '',
  });

  useEffect(() => {
    if (projectId) {
      fetchProjet();
    }
  }, [projectId]);

  const fetchProjet = async () => {
    try {
      const res = await fetch(`/api/projets/${projectId}`);
      const data = await res.json();
      setProjet(data);
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
        body: JSON.stringify({
          projetId: projectId,
          ...formData,
        }),
      });

      if (!res.ok) {
        const payload = await res.json();
        setTaskFormError(payload?.error || 'Erreur lors de la creation de la tache.');
        return;
      }

      if (res.ok) {
        await fetchProjet();
        setFormData({ libelle: '', description: '', priorite: 'Moyenne', dateFinPrevisionnelle: '' });
        setShowTaskForm(false);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setTaskFormError('Erreur reseau lors de la creation de la tache.');
    }
  };

  const updateTaskStatus = async (taskId: string, newStatut: string) => {
    try {
      const res = await fetch(`/api/taches/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut }),
      });
      if (res.ok) {
        await fetchProjet();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (!projet) return <div>Projet non trouvé</div>;

  const getTasksByStatus = (status: string) => projet.taches.filter((t) => t.statut === status);

  const getPriotiteColor = (priorite: string) => {
    switch (priorite) {
      case 'Haute':
        return 'bg-red-100 text-red-800';
      case 'Moyenne':
        return 'bg-yellow-100 text-yellow-800';
      case 'Basse':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-primary">{projet.libelle}</h1>
        <p className="text-gray-600 mt-2">{projet.description}</p>
        <div className="flex gap-4 mt-4">
          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded font-medium">{projet.statut}</span>
          <span className="text-sm text-gray-600">Équipe: {projet.equipeProjet.length}</span>
        </div>
      </div>

      <button
        onClick={() => setShowTaskForm(!showTaskForm)}
        className="bg-secondary hover:bg-secondary/90 text-white px-6 py-2 rounded-lg font-semibold"
      >
        + Nouvelle tâche
      </button>

      {showTaskForm && (
        <form onSubmit={handleTaskSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Libellé *</label>
            <input
              type="text"
              required
              value={formData.libelle}
              onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Priorité</label>
              <select
                value={formData.priorite}
                onChange={(e) => setFormData({ ...formData, priorite: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option>Haute</option>
                <option>Moyenne</option>
                <option>Basse</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date fin prévisionnelle</label>
              <input
                type="date"
                value={formData.dateFinPrevisionnelle}
                onChange={(e) => setFormData({ ...formData, dateFinPrevisionnelle: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg">
              Créer
            </button>
            <button
              type="button"
              onClick={() => setShowTaskForm(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
            >
              Annuler
            </button>
          </div>
          {taskFormError && <p className="text-sm text-red-600">{taskFormError}</p>}
        </form>
      )}

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-primary mb-4">Tableau Kanban</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {STATUTS.map((statut) => (
            <div key={statut} className="bg-gray-100 rounded-lg p-4 min-w-[300px]">
              <h3 className="font-semibold text-lg mb-4 text-gray-800">{statut}</h3>
              <div className="space-y-3">
                {getTasksByStatus(statut).map((task) => (
                  <div key={task.id} className="bg-white rounded-lg p-3 border-l-4 border-primary shadow-sm cursor-move">
                    <p className="font-medium text-gray-800">{task.libelle}</p>
                    {task.description && <p className="text-xs text-gray-600 mt-1">{task.description}</p>}
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${getPriotiteColor(task.priorite)}`}>
                        {task.priorite}
                      </span>
                      {task.assigneA && (
                        <span className="text-xs bg-blue-50 px-2 py-1 rounded text-blue-700">
                          {task.assigneA.nom}
                        </span>
                      )}
                    </div>
                    {statut !== 'Terminé' && statut !== 'Validé' && (
                      <div className="mt-3 flex gap-2">
                        {STATUTS.indexOf(statut) < STATUTS.length - 1 && (
                          <button
                            onClick={() =>
                              updateTaskStatus(task.id, STATUTS[STATUTS.indexOf(statut) + 1])
                            }
                            className="text-xs bg-primary hover:bg-primary/90 text-white px-2 py-1 rounded"
                          >
                            Suivant →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-primary mb-4">Équipe</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projet.equipeProjet.map((membre) => (
            <div key={membre.id} className="border rounded-lg p-4">
              <p className="font-semibold">{membre.nom} {membre.prenoms}</p>
              <p className="text-sm text-gray-600">{membre.fonction}</p>
              <p className="text-xs text-gray-500">{membre.email}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
