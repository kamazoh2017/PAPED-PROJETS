'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';

interface MeResponse {
  id: string;
  email: string | null;
  telephone: string | null;
  estSuperAdmin: boolean;
  doitChangerMdp: boolean;
  personne: {
    nom: string;
    prenoms: string;
    email: string;
    telephone: string | null;
    fonction: string;
    estChefProjet: boolean;
    entite: { libelle: string } | null;
  } | null;
}

function passwordStrength(pwd: string): { label: string; color: string; width: string } {
  if (pwd.length === 0) return { label: '', color: '', width: '0%' };
  if (pwd.length < 8) return { label: 'Trop court', color: 'bg-red-500', width: '25%' };
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasDigit = /\d/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const score = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
  if (score <= 1) return { label: 'Faible', color: 'bg-red-400', width: '35%' };
  if (score === 2) return { label: 'Moyen', color: 'bg-amber-400', width: '60%' };
  if (score === 3) return { label: 'Bon', color: 'bg-blue-500', width: '80%' };
  return { label: 'Fort', color: 'bg-green-500', width: '100%' };
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="text-sm text-slate-800">{value}</span>
    </div>
  );
}

export default function ProfilPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchMe = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (res.ok) setMe(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMe(); }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Erreur lors de la mise à jour.');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Mot de passe mis à jour avec succès.');
      await fetchMe();
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  const strength = passwordStrength(newPassword);
  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;

  const displayName = me?.personne
    ? `${me.personne.prenoms} ${me.personne.nom}`
    : me?.email || 'Utilisateur';

  const initials = me?.personne
    ? `${me.personne.prenoms[0] ?? ''}${me.personne.nom[0] ?? ''}`.toUpperCase()
    : (me?.email?.[0] || 'U').toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">

      {/* ── Carte profil ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* En-tête avatar + nom */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-slate-900">{displayName}</h1>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {me?.estSuperAdmin && (
                <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                  Super-administrateur
                </span>
              )}
              {me?.personne?.estChefProjet && (
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                  Chef de projet
                </span>
              )}
              {!me?.estSuperAdmin && !me?.personne?.estChefProjet && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  Utilisateur
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bannière doitChangerMdp */}
        {me?.doitChangerMdp && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-700">
              Votre mot de passe par défaut n&apos;a pas encore été changé. Veuillez le mettre à jour ci-dessous.
            </p>
          </div>
        )}

        {/* Infos personnelles */}
        {me?.personne ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-slate-100 pt-5">
            <InfoRow label="Prénom(s)" value={me.personne.prenoms} />
            <InfoRow label="Nom" value={me.personne.nom} />
            <InfoRow label="Email" value={me.personne.email} />
            <InfoRow label="Téléphone" value={me.personne.telephone} />
            <InfoRow label="Fonction" value={me.personne.fonction} />
            <InfoRow label="Entité" value={me.personne.entite?.libelle} />
          </div>
        ) : (
          <div className="mt-5 border-t border-slate-100 pt-5">
            <InfoRow label="Identifiant" value={me?.email} />
          </div>
        )}
      </div>

      {/* ── Changer le mot de passe ──────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <KeyRound className="h-4 w-4 text-slate-500" />
          <h2 className="text-base font-semibold text-slate-800">Changer le mot de passe</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Mot de passe actuel */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Mot de passe actuel</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Nouveau mot de passe */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Indicateur de force */}
            {newPassword.length > 0 && (
              <div className="mt-1.5 space-y-1">
                <div className="h-1.5 w-full rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${strength.color}`}
                    style={{ width: strength.width }}
                  />
                </div>
                <p className="text-xs text-slate-500">Force : <span className="font-medium">{strength.label}</span></p>
              </div>
            )}
          </div>

          {/* Confirmer le nouveau mot de passe */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Confirmer le nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 ${
                  confirmMismatch
                    ? 'border-red-300 focus:ring-red-300'
                    : 'border-slate-200 focus:ring-primary/30'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmMismatch && (
              <p className="mt-1 text-xs text-red-600">Les mots de passe ne correspondent pas.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || confirmMismatch}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-opacity"
          >
            {submitting ? 'Mise à jour...' : 'Mettre à jour'}
          </button>

          {message && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
              <p className="text-sm text-green-700">{message}</p>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
