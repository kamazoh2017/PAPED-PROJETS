'use client';

import { useEffect, useState } from 'react';

interface Personne {
  id: string;
  nom: string;
  prenoms: string;
  email: string;
  fonction: string;
  telephone?: string;
  entite: { libelle: string };
}

interface EntiteOption {
  id: string;
  libelle: string;
}

export default function PersonnesPage() {
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [entites, setEntites] = useState<EntiteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenoms: '',
    email: '',
    fonction: '',
    telephone: '',
    entiteId: '',
  });

  useEffect(() => {
    fetchPersonnes();
    fetchEntites();
  }, []);

  const fetchPersonnes = async () => {
    try {
      const res = await fetch('/api/personnes');
      const data = await res.json();

      if (!res.ok) {
        setPersonnes([]);
        return;
      }

      setPersonnes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur:', error);
      setPersonnes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntites = async () => {
    try {
      const res = await fetch('/api/entites');
      const data = await res.json();

      if (!res.ok) {
        console.error('Erreur API entites:', data?.error || 'Erreur inconnue');
        setEntites([]);
        return;
      }

      setEntites(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur:', error);
      setEntites([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/personnes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        await fetchPersonnes();
        setFormData({ nom: '', prenoms: '', email: '', fonction: '', telephone: '', entiteId: '' });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-primary">Personnes ressources</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-secondary hover:bg-secondary/90 text-white px-6 py-2 rounded-lg font-semibold"
        >
          + Nouvelle personne
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom *</label>
              <input
                type="text"
                required
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Prénoms *</label>
              <input
                type="text"
                required
                value={formData.prenoms}
                onChange={(e) => setFormData({ ...formData, prenoms: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Téléphone</label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fonction *</label>
              <input
                type="text"
                required
                value={formData.fonction}
                onChange={(e) => setFormData({ ...formData, fonction: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Entité *</label>
              <select
                required
                value={formData.entiteId}
                onChange={(e) => setFormData({ ...formData, entiteId: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Sélectionner une entité</option>
                {entites.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.libelle}
                  </option>
                ))}
              </select>
            </div>
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
        <div className="overflow-x-auto">
          <table className="w-full bg-white shadow-md rounded-lg">
            <thead className="bg-primary text-white">
              <tr>
                <th className="px-6 py-3 text-left">Nom</th>
                <th className="px-6 py-3 text-left">Prénom</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Fonction</th>
                <th className="px-6 py-3 text-left">Entité</th>
              </tr>
            </thead>
            <tbody>
              {personnes.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3">{p.nom}</td>
                  <td className="px-6 py-3">{p.prenoms}</td>
                  <td className="px-6 py-3">{p.email}</td>
                  <td className="px-6 py-3">{p.fonction}</td>
                  <td className="px-6 py-3">{p.entite.libelle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
