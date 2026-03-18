'use client';

import { useEffect, useState } from 'react';

interface Tache {
  id: string;
  libelle: string;
  statut: string;
  priorite: string;
  projet?: { libelle: string; id: string };
  assigneA?: { nom: string; prenoms: string };
}

interface Projet {
  id: string;
  libelle: string;
  statut: string;
  taches: Tache[];
}

const STATUTS_TACHES = ['Backlog', 'A faire', 'En cours', 'En attente', 'Bloqué', 'Terminé', 'A valider', 'Validé'];
const STATUTS_PROJETS = ['Demarrage', 'En cours', 'Terminé', 'Réceptionné', 'Clôturé'];

export default function DashboardPage() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [taches, setTaches] = useState<Tache[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProjet, setFilterProjet] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [proRes, tRes] = await Promise.all([
        fetch('/api/projets'),
        fetch('/api/taches'),
      ]);
      const projetsData = await proRes.json();
      const tachesData = await tRes.json();
      setProjets(projetsData);
      setTaches(tachesData);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTaches = taches.filter((t) => {
    if (filterProjet && t.projet?.id !== filterProjet) return false;
    if (filterStatut && t.statut !== filterStatut) return false;
    return true;
  });

  const getTachesParStatut = (statut: string) => filteredTaches.filter((t) => t.statut === statut).length;

  const getTachesParPriorite = (priorite: string) => filteredTaches.filter((t) => t.priorite === priorite).length;

  const getProjetsTotalTaches = (projetId: string) => taches.filter((t) => t.projet?.id === projetId).length;

  const getProjetsTachesTerminees = (projetId: string) =>
    taches.filter((t) => t.projet?.id === projetId && t.statut === 'Terminé').length;

  const getVelocite = (projetId: string) => {
    const projetTaches = taches.filter((t) => t.projet?.id === projetId);
    return projetTaches.length > 0
      ? ((projetTaches.filter((t) => t.statut === 'Terminé').length / projetTaches.length) * 100).toFixed(1)
      : '0';
  };

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-primary">Tableau de bord global</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-600 text-sm">Total tâches</p>
          <p className="text-3xl font-bold text-primary mt-2">{taches.length}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-600 text-sm">Tâches terminées</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{getTachesParStatut('Terminé')}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-600 text-sm">Tâches bloquées</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{getTachesParStatut('Bloqué')}</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-600 text-sm">Projets actifs</p>
          <p className="text-3xl font-bold text-secondary mt-2">{projets.filter((p) => p.statut !== 'Clôturé').length}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-bold text-primary mb-4">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Par projet</label>
            <select
              value={filterProjet}
              onChange={(e) => setFilterProjet(e.target.value)}
              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Tous les projets</option>
              {projets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.libelle}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Par statut</label>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Tous les statuts</option>
              {STATUTS_TACHES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              onClick={() => {
                setFilterProjet('');
                setFilterStatut('');
              }}
              className="mt-6 w-full bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Tâches par statut */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        {STATUTS_TACHES.map((statut) => (
          <div key={statut} className="bg-white shadow-sm rounded-lg p-4 text-center">
            <p className="text-gray-600 text-xs">{statut}</p>
            <p className="text-2xl font-bold text-primary mt-2">{getTachesParStatut(statut)}</p>
          </div>
        ))}
      </div>

      {/* Priorités */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold text-primary mb-4">Répartition par priorité</h2>
        <div className="flex gap-4">
          <div className="bg-red-50 rounded-lg p-4 flex-1">
            <p className="text-gray-700">Haute</p>
            <p className="text-2xl font-bold text-red-600">{getTachesParPriorite('Haute')}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 flex-1">
            <p className="text-gray-700">Moyenne</p>
            <p className="text-2xl font-bold text-yellow-600">{getTachesParPriorite('Moyenne')}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 flex-1">
            <p className="text-gray-700">Basse</p>
            <p className="text-2xl font-bold text-green-600">{getTachesParPriorite('Basse')}</p>
          </div>
        </div>
      </div>

      {/* Projets avec KPIs */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold text-primary mb-4">Synthèse par projet</h2>
        <div className="space-y-4">
          {projets.map((projet) => (
            <div key={projet.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800">{projet.libelle}</h3>
                <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                  {projet.statut}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total tâches</p>
                  <p className="text-lg font-bold text-primary">{getProjetsTotalTaches(projet.id)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Terminées</p>
                  <p className="text-lg font-bold text-green-600">{getProjetsTachesTerminees(projet.id)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Vélocité</p>
                  <p className="text-lg font-bold text-secondary">{getVelocite(projet.id)}%</p>
                </div>
                <div>
                  <a href={`/projets/${projet.id}`} className="text-primary hover:underline font-semibold">
                    Voir le détail →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tâches filtrées */}
      {(filterProjet || filterStatut) && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold text-primary mb-4">Tâches filtrées ({filteredTaches.length})</h2>
          <div className="space-y-3">
            {filteredTaches.map((tache) => (
              <div key={tache.id} className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">{tache.libelle}</p>
                  <p className="text-sm text-gray-600">{tache.projet?.libelle}</p>
                </div>
                <div className="flex gap-2">
                  <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                    {tache.statut}
                  </span>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium text-white ${
                    tache.priorite === 'Haute' ? 'bg-red-500' : tache.priorite === 'Moyenne' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    {tache.priorite}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
