'use client';

import { useEffect, useState } from 'react';

interface Entite {
  id: string;
  libelle: string;
  tutelle?: string;
  personnesRessources: any[];
  partiesPrenantes: any[];
}

export default function EntitesPage() {
  const [entites, setEntites] = useState<Entite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ libelle: '', tutelle: '' });

  useEffect(() => {
    fetchEntites();
  }, []);

  const fetchEntites = async () => {
    try {
      const res = await fetch('/api/entites');
      const data = await res.json();
      if (!res.ok) { setEntites([]); return; }
      setEntites(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur:', error);
      setEntites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/entites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        await fetchEntites();
        setFormData({ libelle: '', tutelle: '' });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-primary">Entités</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-secondary hover:bg-secondary/90 text-white px-6 py-2 rounded-lg font-semibold"
        >
          + Nouvelle entité
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
              placeholder="Nom de l'entité"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tutelle</label>
            <input
              type="text"
              value={formData.tutelle}
              onChange={(e) => setFormData({ ...formData, tutelle: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Tutelle de l'entité"
            />
          </div>
          <div className="flex gap-4">
            <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg">
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
        <p>Chargement...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entites.map((entite) => (
            <div key={entite.id} className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-primary mb-2">{entite.libelle}</h2>
              {entite.tutelle && <p className="text-gray-600 mb-2">Tutelle: {entite.tutelle}</p>}
              <p className="text-sm text-gray-500">Membres: {entite.personnesRessources.length}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
