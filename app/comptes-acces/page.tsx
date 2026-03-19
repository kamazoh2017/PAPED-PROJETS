'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

interface Entite {
  id: string;
  libelle: string;
}

interface Personne {
  id: string;
  nom: string;
  prenoms: string;
  email: string;
  telephone?: string;
  entite: Entite;
}

interface CompteAcces {
  id: string;
  estActif: boolean;
  doitChangerMdp: boolean;
  dateCreation: string;
  dateDerniereConnex?: string;
  personne: Personne;
  _count?: { permissions: number };
}

export default function ComptesAccesPage() {
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [comptes, setComptes] = useState<CompteAcces[]>([]);
  const [selectedPersonneId, setSelectedPersonneId] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [personnesRes, comptesRes] = await Promise.all([fetch('/api/personnes'), fetch('/api/comptes-acces')]);
      const personnesData = await personnesRes.json();
      const comptesData = await comptesRes.json();

      setPersonnes(Array.isArray(personnesData) ? personnesData : []);
      setComptes(Array.isArray(comptesData) ? comptesData : []);
    } catch {
      setError('Erreur lors du chargement des donnees.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const personnesSansCompte = useMemo(() => {
    const ids = new Set(comptes.map((c) => c.personne.id));
    return personnes.filter((p) => !ids.has(p.id));
  }, [personnes, comptes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!selectedPersonneId) {
      setError('Selectionnez une ressource.');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/comptes-acces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personneId: selectedPersonneId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'Erreur de creation du compte.');
        return;
      }

      setSelectedPersonneId('');
      setMessage(`Compte cree. Mot de passe par defaut: ${data.motDePasseParDefaut}`);
      await fetchData();
    } catch {
      setError('Erreur reseau.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Gestion des comptes d'acces</h1>
          <p className="text-sm text-slate-500 mt-1">
            Creer des comptes pour les ressources, puis definir les autorisations par page et action.
          </p>
        </div>
        <Link
          href="/connexion"
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Tester la connexion
        </Link>
      </div>

      <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">1. Creation de compte utilisateur</h2>
        <p className="mt-1 text-xs text-slate-500">
          Selectionnez une ressource d'entite. Tous les utilisateurs recoivent le mot de passe par defaut 0123456789,
          qu'ils peuvent modifier dans leur profil. La connexion se fait avec telephone (10 chiffres) ou email.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full sm:max-w-md">
            <label className="mb-1 block text-xs font-medium text-slate-600">Ressource</label>
            <select
              value={selectedPersonneId}
              onChange={(e) => setSelectedPersonneId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Selectionner une ressource</option>
              {personnesSansCompte.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.prenoms} {p.nom} - {p.telephone || 'sans tel'} / {p.email} ({p.entite?.libelle || 'Sans entite'})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={creating || !selectedPersonneId}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? 'Creation...' : 'Creer le compte'}
          </button>
        </div>

        {message && (
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>
        )}
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-lg font-semibold text-slate-800">3. Liste des utilisateurs et action autorisation</h2>
        </div>

        {loading ? (
          <p className="p-5 text-sm text-slate-500">Chargement...</p>
        ) : comptes.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Aucun compte cree pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Utilisateur</th>
                  <th className="px-5 py-3">Entite</th>
                  <th className="px-5 py-3">Etat</th>
                  <th className="px-5 py-3">Derniere connexion</th>
                  <th className="px-5 py-3">Autorisations</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {comptes.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{c.personne.prenoms} {c.personne.nom}</p>
                      <p className="text-xs text-slate-500">{c.personne.telephone || 'Sans telephone'}</p>
                      <p className="text-xs text-slate-500">{c.personne.email}</p>
                    </td>
                    <td className="px-5 py-3">{c.personne.entite?.libelle || '—'}</td>
                    <td className="px-5 py-3">
                      {c.estActif ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Actif</span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Inactif</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {c.dateDerniereConnex
                        ? new Date(c.dateDerniereConnex).toLocaleString('fr-FR')
                        : 'Jamais'}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{c._count?.permissions ?? 0} actions definies</td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/comptes-acces/autorisations/${c.id}`}
                        className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-white hover:bg-secondary/90"
                      >
                        Autorisation
                      </Link>
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
