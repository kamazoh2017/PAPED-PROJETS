'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Projet {
  id: string;
  libelle: string;
  description?: string;
  statut: string;
  dateCreation: string;
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

export default function ProjetsPage() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ libelle: '', description: '', chefProjetId: '' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchProjets();
    fetchPersonnes();
  }, []);

  const fetchProjets = async () => {
    try {
      const res = await fetch('/api/projets');
      const data = await res.json();
      setProjets(data);
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
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
        setFormData({ libelle: '', description: '', chefProjetId: '' });
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
          {projets.map((projet) => (
            <Link
              key={projet.id}
              href={`/projets/${projet.id}`}
              className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg hover:border-primary border border-transparent transition cursor-pointer"
            >
              <h2 className="text-xl font-semibold text-primary mb-2">{projet.libelle}</h2>
              <p className="text-gray-600 mb-4">{projet.description || 'Pas de description'}</p>
              <div className="flex justify-between items-center mb-2">
                <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                  {projet.statut}
                </span>
                <span className="text-sm text-gray-500">Équipe: {projet.equipeProjet.length}</span>
              </div>
              <span className="text-sm text-gray-500">Tâches: {projet.taches.length}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
