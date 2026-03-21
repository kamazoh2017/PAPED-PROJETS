'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Projet {
  id: string;
  libelle: string;
  description?: string;
  statut: string;
  dateCreation: string;
  dateDebutPrevisionnelle?: string;
  dateFinPrevisionnelle?: string;
  chefProjet?: { nom: string; prenoms: string };
  equipeProjet: any[];
  taches: any[];
}

interface Personne {
  id: string;
  nom: string;
  prenoms: string;
  fonction: string;
  estChefProjet?: boolean;
}

type Avancement = 'retard' | 'en-avance' | 'hors-delai';

const AVANCEMENT_CONFIG: Record<Avancement, { label: string; classes: string }> = {
  retard:       { label: 'En retard',  classes: 'bg-red-100 text-red-700' },
  'en-avance':  { label: 'En avance',  classes: 'bg-green-100 text-green-700' },
  'hors-delai': { label: 'Hors délai', classes: 'bg-orange-100 text-orange-700' },
};

function getAvanancementProjet(projet: Projet): Avancement | null {
  const STATUTS_ACTIFS = ['En démarrage', 'En cours'];
  if (!STATUTS_ACTIFS.includes(projet.statut)) return null;

  const now = Date.now();
  const fin = projet.dateFinPrevisionnelle ? new Date(projet.dateFinPrevisionnelle).getTime() : null;
  const tasks = projet.taches ?? [];
  const totalTasks = tasks.length;

  // Si la date prévisionnelle de fin est dépassée
  if (fin && fin <= now) {
    if (totalTasks === 0) return 'hors-delai';
    const doneTasks = tasks.filter((t: any) => t.statut === 'Terminé' || t.statut === 'Validé').length;
    return doneTasks < totalTasks ? 'hors-delai' : 'en-avance';
  }

  // Date non dépassée — comparer taux effectif vs taux prévisionnel
  if (totalTasks === 0) return 'en-avance';
  const doneTasks = tasks.filter((t: any) => t.statut === 'Terminé' || t.statut === 'Validé').length;
  const tauxEffectif = doneTasks / totalTasks;
  const tasksDuByNow = tasks.filter((t: any) => {
    const fp = t.dateFinPrevisionnelle ? new Date(t.dateFinPrevisionnelle).getTime() : null;
    return fp !== null && fp <= now;
  }).length;
  const tauxPrevisionnel = tasksDuByNow / totalTasks;

  return tauxEffectif < tauxPrevisionnel ? 'retard' : 'en-avance';
}

export default function ProjetsPage() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ libelle: '', description: '', chefProjetId: '', dateDebutPrevisionnelle: '', dateFinPrevisionnelle: '' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchProjets();
    fetchPersonnes();
  }, []);

  const fetchProjets = async () => {
    try {
      const res = await fetch('/api/projets');
      const data = await res.json();

      if (!res.ok) {
        setProjets([]);
        return;
      }

      setProjets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
      setProjets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonnes = async () => {
    try {
      const res = await fetch('/api/personnes');
      const data = await res.json();
      setPersonnes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des personnes:', error);
      setPersonnes([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.chefProjetId) {
      setFormError('Veuillez selectionner un chef de projet.');
      return;
    }

    try {
      const res = await fetch('/api/projets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          libelle: formData.libelle,
          description: formData.description,
          chefProjetId: formData.chefProjetId,
        }),
      });

      if (!res.ok) {
        const payload = await res.json();
        setFormError(payload?.error || 'Erreur lors de la creation du projet.');
        return;
      }

      if (res.ok) {
        await fetchProjets();
        setFormData({ libelle: '', description: '', chefProjetId: '', dateDebutPrevisionnelle: '', dateFinPrevisionnelle: '' });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Erreur lors de la création du projet:', error);
      setFormError('Erreur reseau lors de la creation du projet.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-primary">Projets</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-secondary hover:bg-secondary/90 text-white px-6 py-2 rounded-lg font-semibold"
        >
          + Nouveau projet
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Libellé *</label>
            <input
              type="text"
              required
              value={formData.libelle}
              onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Nom du projet"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Description du projet"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Chef de projet *</label>
            <select
              required
              value={formData.chefProjetId}
              onChange={(e) => setFormData({ ...formData, chefProjetId: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Selectionner une personne</option>
              {personnes.map((personne) => (
                <option key={personne.id} value={personne.id}>
                  {personne.nom} {personne.prenoms} - {personne.fonction}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Début prévisionnel</label>
              <input
                type="date"
                value={formData.dateDebutPrevisionnelle}
                onChange={(e) => setFormData({ ...formData, dateDebutPrevisionnelle: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fin prévisionnelle</label>
              <input
                type="date"
                value={formData.dateFinPrevisionnelle}
                onChange={(e) => setFormData({ ...formData, dateFinPrevisionnelle: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg"
            >
              Créer
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : projets.length === 0 ? (
        <p className="text-gray-500">Aucun projet créé.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projets.map((projet) => {
            const avancement = getAvanancementProjet(projet);
            const avCfg = avancement ? AVANCEMENT_CONFIG[avancement] : null;
            return (
            <Link
              key={projet.id}
              href={`/projets/${projet.id}`}
              className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg hover:border-primary border border-transparent transition cursor-pointer"
            >
              <h2 className="text-xl font-semibold text-primary mb-2">{projet.libelle}</h2>
              {projet.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{projet.description}</p>
              )}
              <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
                <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                  {projet.statut}
                </span>
                {avCfg && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${avCfg.classes}`}>
                    {avCfg.label}
                  </span>
                )}
                <span className="text-sm text-gray-500">Équipe: {projet.equipeProjet.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                <span>Tâches: {projet.taches.length}</span>
                {projet.dateFinPrevisionnelle && (
                  <span>Fin prév. {new Date(projet.dateFinPrevisionnelle).toLocaleDateString('fr-FR')}</span>
                )}
              </div>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
