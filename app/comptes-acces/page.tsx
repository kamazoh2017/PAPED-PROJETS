'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { UserX, UserCheck, UserCog, ShieldCheck, X, KeyRound, Eye, EyeOff } from 'lucide-react';
import { ROLE_LABELS, ROLE_DESCRIPTIONS, type RoleKey } from '@/lib/roles-permissions';

interface Entite  { id: string; libelle: string; }
interface Personne {
  id: string; nom: string; prenoms: string;
  email: string; telephone?: string; entite: Entite;
}
interface CompteAcces {
  id: string; estActif: boolean; doitChangerMdp: boolean; role: string;
  dateCreation: string; dateDerniereConnex?: string;
  personne: Personne; _count?: { permissions: number };
}

const ROLES: RoleKey[] = ['AGENT', 'GESTIONNAIRE', 'COORDINATEUR', 'ADMINISTRATEUR'];

const ROLE_BADGE: Record<string, { bg: string; text: string }> = {
  AGENT:          { bg: 'bg-slate-100',    text: 'text-slate-600' },
  GESTIONNAIRE:   { bg: 'bg-blue-100',     text: 'text-blue-700'  },
  COORDINATEUR:   { bg: 'bg-violet-100',   text: 'text-violet-700'},
  ADMINISTRATEUR: { bg: 'bg-amber-100',    text: 'text-amber-700' },
};

export default function ComptesAccesPage() {
  const [personnes, setPersonnes]         = useState<Personne[]>([]);
  const [comptes, setComptes]             = useState<CompteAcces[]>([]);
  const [selectedPersonneId, setSelectedPersonneId] = useState('');
  const [selectedRole, setSelectedRole]   = useState<RoleKey>('AGENT');
  const [loading, setLoading]             = useState(true);
  const [creating, setCreating]           = useState(false);
  const [message, setMessage]             = useState('');
  const [error, setError]                 = useState('');

  // Suspension
  const [suspendLoading, setSuspendLoading] = useState<string | null>(null);

  // Modal rôle
  const [roleModalId, setRoleModalId]     = useState<string | null>(null);
  const [roleModalValue, setRoleModalValue] = useState<RoleKey>('AGENT');
  const [roleApplying, setRoleApplying]   = useState(false);
  const [roleError, setRoleError]         = useState('');
  const [roleSuccess, setRoleSuccess]     = useState('');

  // Modal mot de passe
  const [mdpModalId, setMdpModalId]       = useState<string | null>(null);
  const [mdpValue, setMdpValue]           = useState('');
  const [mdpVisible, setMdpVisible]       = useState(false);
  const [mdpSaving, setMdpSaving]         = useState(false);
  const [mdpError, setMdpError]           = useState('');
  const [mdpSuccess, setMdpSuccess]       = useState('');

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const [pr, cr] = await Promise.all([fetch('/api/personnes'), fetch('/api/comptes-acces')]);
      const pd = await pr.json(); const cd = await cr.json();
      setPersonnes(Array.isArray(pd) ? pd : []);
      setComptes(Array.isArray(cd) ? cd : []);
    } catch { setError('Erreur lors du chargement des données.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const personnesSansCompte = useMemo(() => {
    const ids = new Set(comptes.map(c => c.personne.id));
    return personnes.filter(p => !ids.has(p.id));
  }, [personnes, comptes]);

  // ── Création de compte ────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); setError('');
    if (!selectedPersonneId) { setError('Sélectionnez une ressource.'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/comptes-acces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personneId: selectedPersonneId, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error || 'Erreur de création du compte.'); return; }
      setSelectedPersonneId('');
      setSelectedRole('AGENT');
      setMessage(`Compte créé (${ROLE_LABELS[selectedRole]}). Mot de passe par défaut : ${data.motDePasseParDefaut}`);
      await fetchData();
    } catch { setError('Erreur réseau.'); }
    finally { setCreating(false); }
  };

  // ── Suspension ────────────────────────────────────────────────────────────────

  const handleSuspend = async (id: string, currentState: boolean) => {
    setSuspendLoading(id);
    try {
      const res = await fetch(`/api/comptes-acces/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estActif: !currentState }),
      });
      if (res.ok) await fetchData();
    } catch { /* silently */ }
    finally { setSuspendLoading(null); }
  };

  // ── Modal rôle ────────────────────────────────────────────────────────────────

  const openRoleModal = (compte: CompteAcces) => {
    setRoleModalId(compte.id);
    setRoleModalValue((compte.role as RoleKey) ?? 'AGENT');
    setRoleError(''); setRoleSuccess('');
  };

  const handleApplyRole = async () => {
    if (!roleModalId) return;
    setRoleApplying(true); setRoleError(''); setRoleSuccess('');
    try {
      const res = await fetch(`/api/comptes-acces/${roleModalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleModalValue }),
      });
      const data = await res.json();
      if (!res.ok) { setRoleError(data?.error || 'Erreur lors du changement de rôle.'); return; }
      setRoleSuccess(`Rôle changé en « ${ROLE_LABELS[roleModalValue]} ». Les permissions ont été réinitialisées.`);
      await fetchData();
      setTimeout(() => setRoleModalId(null), 1800);
    } catch { setRoleError('Erreur réseau.'); }
    finally { setRoleApplying(false); }
  };

  const roleModalCompte = roleModalId ? comptes.find(c => c.id === roleModalId) : null;

  // ── Modal mot de passe ────────────────────────────────────────────────────────

  const openMdpModal = (id: string) => {
    setMdpModalId(id); setMdpValue(''); setMdpVisible(false);
    setMdpError(''); setMdpSuccess('');
  };

  const handleChangeMdp = async () => {
    if (!mdpModalId) return;
    const mdp = mdpValue.trim();
    if (mdp.length < 6) { setMdpError('Minimum 6 caractères.'); return; }
    setMdpSaving(true); setMdpError('');
    try {
      const res = await fetch(`/api/comptes-acces/${mdpModalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motDePasse: mdp }),
      });
      const data = await res.json();
      if (!res.ok) { setMdpError(data?.error || 'Erreur.'); return; }
      setMdpSuccess('Mot de passe modifié. L\'utilisateur devra le changer à la prochaine connexion.');
      setMdpValue('');
      setTimeout(() => setMdpModalId(null), 2000);
    } catch { setMdpError('Erreur réseau.'); }
    finally { setMdpSaving(false); }
  };

  const mdpModalCompte = mdpModalId ? comptes.find(c => c.id === mdpModalId) : null;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Modal mot de passe ── */}
      {mdpModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Modifier le mot de passe</h3>
              <button onClick={() => setMdpModalId(null)} className="p-1 rounded hover:bg-slate-100 text-slate-400"><X size={16} /></button>
            </div>
            {mdpModalCompte && (
              <p className="text-sm text-slate-600 font-semibold">{mdpModalCompte.personne.prenoms} {mdpModalCompte.personne.nom}</p>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nouveau mot de passe <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={mdpVisible ? 'text' : 'password'}
                  value={mdpValue}
                  onChange={e => setMdpValue(e.target.value)}
                  placeholder="Min. 6 caractères"
                  className="w-full px-3 py-2 pr-9 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30"
                />
                <button type="button" onClick={() => setMdpVisible(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {mdpVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {mdpError   && <p className="text-xs text-red-600">{mdpError}</p>}
            {mdpSuccess && <p className="text-xs text-green-600">{mdpSuccess}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setMdpModalId(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">Annuler</button>
              <button onClick={handleChangeMdp} disabled={!mdpValue.trim() || mdpSaving} className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold">
                {mdpSaving ? 'Modification…' : 'Modifier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal rôle ── */}
      {roleModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Changer le rôle</h3>
              <button onClick={() => setRoleModalId(null)} className="p-1 rounded hover:bg-slate-100 text-slate-400"><X size={16} /></button>
            </div>
            {roleModalCompte && (
              <p className="text-sm text-slate-600">
                <span className="font-semibold">{roleModalCompte.personne.prenoms} {roleModalCompte.personne.nom}</span>
                <span className="ml-2 text-slate-400 text-xs">{roleModalCompte.personne.entite?.libelle}</span>
              </p>
            )}
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Changer le rôle réinitialise les autorisations détaillées selon les défauts du nouveau rôle.
            </p>
            <div className="space-y-2">
              {ROLES.map(r => {
                const badge = ROLE_BADGE[r];
                return (
                  <label key={r} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${roleModalValue === r ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name="role" value={r} checked={roleModalValue === r} onChange={() => setRoleModalValue(r)} className="mt-1 accent-primary" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">{ROLE_LABELS[r]}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>{r}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{ROLE_DESCRIPTIONS[r]}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            {roleError   && <p className="text-xs text-red-600">{roleError}</p>}
            {roleSuccess && <p className="text-xs text-green-600">{roleSuccess}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRoleModalId(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">Annuler</button>
              <button
                onClick={handleApplyRole}
                disabled={roleApplying || roleModalValue === (roleModalCompte?.role ?? 'AGENT')}
                className="px-4 py-2 text-sm rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold"
              >
                {roleApplying ? 'Application…' : 'Appliquer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Entête ── */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Gestion des comptes d'accès</h1>
        <p className="text-sm text-slate-500 mt-1">Créer des comptes, attribuer un rôle, affiner les autorisations individuellement.</p>
      </div>

      {/* ── Formulaire de création ── */}
      <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Créer un compte utilisateur</h2>
          <p className="mt-1 text-xs text-slate-500">
            Sélectionnez une ressource, choisissez son rôle. Le mot de passe par défaut est <code className="bg-slate-100 px-1 rounded">0123456789</code>.
            La connexion se fait par téléphone ou email.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end flex-wrap">
          <div className="w-full sm:max-w-md">
            <label className="mb-1 block text-xs font-medium text-slate-600">Ressource <span className="text-red-500">*</span></label>
            <select
              value={selectedPersonneId}
              onChange={e => setSelectedPersonneId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Sélectionner une ressource</option>
              {personnesSansCompte.map(p => (
                <option key={p.id} value={p.id}>
                  {p.prenoms} {p.nom} — {p.telephone || 'sans tél'} / {p.email} ({p.entite?.libelle || '—'})
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-52">
            <label className="mb-1 block text-xs font-medium text-slate-600">Rôle initial <span className="text-red-500">*</span></label>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value as RoleKey)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={creating || !selectedPersonneId}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
          >
            {creating ? 'Création…' : 'Créer le compte'}
          </button>
        </div>
        {message && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
        {error   && <p className="rounded-lg bg-red-50   px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>

      {/* ── Table des comptes ── */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-lg font-semibold text-slate-800">Comptes utilisateurs</h2>
        </div>
        {loading ? (
          <p className="p-5 text-sm text-slate-500">Chargement…</p>
        ) : comptes.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Aucun compte créé pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Utilisateur</th>
                  <th className="px-5 py-3">Entité</th>
                  <th className="px-5 py-3">Rôle</th>
                  <th className="px-5 py-3">État</th>
                  <th className="px-5 py-3">Dernière connexion</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {comptes.map(c => {
                  const role = (c.role ?? 'AGENT') as RoleKey;
                  const badge = ROLE_BADGE[role] ?? ROLE_BADGE.AGENT;
                  return (
                    <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800">{c.personne.prenoms} {c.personne.nom}</p>
                        <p className="text-xs text-slate-500">{c.personne.telephone || 'Sans téléphone'}</p>
                        <p className="text-xs text-slate-500">{c.personne.email}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{c.personne.entite?.libelle || '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text}`}>
                          {ROLE_LABELS[role] ?? role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {c.estActif ? (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Actif</span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Suspendu</span>
                        )}
                        {c.doitChangerMdp && (
                          <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Mdp temp.</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {c.dateDerniereConnex ? new Date(c.dateDerniereConnex).toLocaleString('fr-FR') : 'Jamais'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {/* Suspendre / Activer */}
                          <button
                            onClick={() => handleSuspend(c.id, c.estActif)}
                            disabled={suspendLoading === c.id}
                            title={c.estActif ? 'Suspendre le compte' : 'Réactiver le compte'}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${c.estActif ? 'text-slate-500 hover:bg-red-50 hover:text-red-600' : 'text-slate-500 hover:bg-green-50 hover:text-green-600'}`}
                          >
                            {c.estActif ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>
                          {/* Changer rôle */}
                          <button
                            onClick={() => openRoleModal(c)}
                            title="Changer le rôle"
                            className="p-2 rounded-lg text-slate-500 hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <UserCog size={15} />
                          </button>
                          {/* Modifier mot de passe */}
                          <button
                            onClick={() => openMdpModal(c.id)}
                            title="Modifier le mot de passe"
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                          >
                            <KeyRound size={15} />
                          </button>
                          {/* Autorisations détaillées */}
                          <Link
                            href={`/comptes-acces/autorisations/${c.id}`}
                            title="Affiner les autorisations"
                            className="p-2 rounded-lg text-slate-500 hover:bg-secondary/10 hover:text-secondary transition-colors"
                          >
                            <ShieldCheck size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
