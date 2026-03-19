'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AccueilPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'Connexion impossible.');
        return;
      }

      if (data?.doitChangerMdp) {
        router.push('/profil');
        return;
      }

      router.push('/tableau-de-bord');
    } catch {
      setError('Erreur reseau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-10">
      <section className="mx-auto grid max-w-6xl gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2 md:p-10">
        <div className="rounded-2xl bg-primary/5 p-6 md:p-8">
          <p className="inline-flex rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            PAPE-D PROJECT TRACKER
          </p>
          <h1 className="mt-4 text-3xl font-bold text-primary md:text-4xl">Suivi des projets et des ressources</h1>
          <p className="mt-4 text-sm leading-6 text-slate-700 md:text-base">
            Centralisez les projets, les taches, les ressources, les parties prenantes et les autorisations dans un
            espace unique. Connectez-vous pour acceder a votre tableau de bord.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <h2 className="text-2xl font-bold text-primary">Authentification</h2>
          <p className="mt-1 text-sm text-slate-500">Connectez-vous avec votre numero de telephone (10 chiffres) ou votre email.</p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Telephone (10 chiffres) ou email</label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Ex: 0701020304 ou user@exemple.com"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Mot de passe</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
