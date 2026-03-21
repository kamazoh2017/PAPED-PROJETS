'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface PermissionAction {
  key: string;
  label: string;
  autorise: boolean;
}

interface PermissionPage {
  key: string;
  label: string;
  actions: PermissionAction[];
}

interface Compte {
  id: string;
  personne: {
    nom: string;
    prenoms: string;
    telephone?: string;
    email: string;
  };
}

export default function AutorisationsComptePage() {
  const params = useParams();
  const id = params.id as string;

  const [compte, setCompte] = useState<Compte | null>(null);
  const [pages, setPages] = useState<PermissionPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchPermissions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/comptes-acces/${id}/autorisations`);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Erreur de chargement.');
        return;
      }
      setCompte(data.compte);
      setPages(data.pages || []);
    } catch {
      setError('Erreur reseau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchPermissions();
  }, [id]);

  const totalActions = useMemo(
    () => pages.reduce((acc, page) => acc + page.actions.length, 0),
    [pages]
  );
  const totalAutorisees = useMemo(
    () => pages.reduce((acc, page) => acc + page.actions.filter((a) => a.autorise).length, 0),
    [pages]
  );
  const allChecked = totalActions > 0 && totalAutorisees === totalActions;

  const toggleAction = (pageKey: string, actionKey: string) => {
    setPages((prev) =>
      prev.map((page) =>
        page.key !== pageKey
          ? page
          : {
              ...page,
              actions: page.actions.map((action) =>
                action.key === actionKey ? { ...action, autorise: !action.autorise } : action
              ),
            }
      )
    );
  };

  const toggleAllActions = () => {
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        actions: page.actions.map((action) => ({ ...action, autorise: !allChecked })),
      }))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const payload = pages.flatMap((page) =>
        page.actions.map((action) => ({
          pageKey: page.key,
          actionKey: action.key,
          autorise: action.autorise,
        }))
      );

      const res = await fetch(`/api/comptes-acces/${id}/autorisations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Erreur de sauvegarde.');
        return;
      }
      setMessage('Autorisations enregistrees avec succes.');
    } catch {
      setError('Erreur reseau lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Chargement des autorisations...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Page autorisation</h1>
          {compte && (
            <p className="mt-1 text-sm text-slate-500">
              Utilisateur: {compte.personne.prenoms} {compte.personne.nom} ({compte.personne.telephone || 'Sans telephone'} / {compte.personne.email})
            </p>
          )}
        </div>
        <Link
          href="/comptes-acces"
          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          Retour liste comptes
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Actions autorisees: <strong>{totalAutorisees}</strong> / {totalActions}
          </p>
          <button
            type="button"
            onClick={toggleAllActions}
            disabled={totalActions === 0}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {allChecked ? 'Tout decocher' : 'Tout cocher'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {pages.map((page) => (
          <section key={page.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-800">{page.label}</h2>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {page.actions.map((action) => (
                <label
                  key={`${page.key}-${action.key}`}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={action.autorise}
                    onChange={() => toggleAction(page.key, action.key)}
                    className="h-4 w-4"
                  />
                  <span>{action.label}</span>
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les autorisations'}
        </button>
        {message && <span className="text-sm text-green-700">{message}</span>}
        {error && <span className="text-sm text-red-700">{error}</span>}
      </div>
    </div>
  );
}
