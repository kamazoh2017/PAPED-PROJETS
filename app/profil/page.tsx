'use client';

import { useEffect, useState } from 'react';

interface MeResponse {
  personne: {
    prenoms: string;
    nom: string;
    email: string;
  } | null;
  email?: string;
  telephone?: string | null;
  estSuperAdmin?: boolean;
  doitChangerMdp: boolean;
}

export default function ProfilPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMe = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (res.ok) setMe(data);
      } finally {
        setLoading(false);
      }
    };

    loadMe();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Erreur de mise a jour.');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setMessage('Mot de passe mis a jour avec succes.');
    } catch {
      setError('Erreur reseau.');
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Chargement du profil...</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-primary">Profil utilisateur</h1>
        {me ? (
          me.personne ? (
            <p className="mt-2 text-sm text-slate-600">
              {me.personne.prenoms} {me.personne.nom} - {me.telephone || 'Sans telephone'} / {me.personne.email}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              {me.email || 'super@super'} {me.estSuperAdmin ? '- Super administrateur' : ''}
            </p>
          )
        ) : (
          <p className="mt-2 text-sm text-slate-500">Aucune session active.</p>
        )}
        {me?.doitChangerMdp && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Votre mot de passe par defaut doit etre change.
          </p>
        )}
      </div>

      <form onSubmit={handleChangePassword} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Changer le mot de passe</h2>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Mot de passe actuel</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Nouveau mot de passe</label>
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        <button type="submit" className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white">
          Mettre a jour
        </button>

        {message && <p className="text-sm text-green-700">{message}</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}
      </form>
    </div>
  );
}
