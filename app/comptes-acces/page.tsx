'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { UserX, UserCheck, UserCog, ShieldCheck, X, KeyRound, Eye, EyeOff } from 'lucide-react';
import { flattenPermissions, PERMISSIONS_CATALOG } from '@/lib/permissions-catalog';

interface Entite { id: string; libelle: string; }
interface Personne {
  id: string; nom: string; prenoms: string;
  email: string; telephone?: string; entite: Entite;
}
interface CompteAcces {
  id: string; estActif: boolean; doitChangerMdp: boolean;
  dateCreation: string; dateDerniereConnex?: string;
  personne: Personne; _count?: { permissions: number };
}

// ─── Présets de rôle ─────────────────────────────────────────────────────────
const ROLES: { key: string; label: string; description: string }[] = [
  { key: 'lecteur',  label: 'Lecteur',         description: 'Consultation uniquement' },
  { key: 'membre',   label: 'Membre équipe',   description: 'Consultation + exécution des tâches' },
  { key: 'chef',     label: 'Chef de projet',  description: 'Gestion des projets et tâches' },
  { key: 'admin',    label: 'Administrateur',  description: 'Accès complet sauf super-admin' },
];

type RolePerms = { pageKey: string; actionKey: string; autorise: boolean }[];

const ALL_PAIRS = flattenPermissions(PERMISSIONS_CATALOG);

function buildRolePermissions(role: string): RolePerms {
  const LECTEUR = new Set([
    'tableau-de-bord:view',
    'projets:view','projets:view-detail',
    'detail-projet:view','detail-projet:view-info',
    'detail-projet:view-libelle','detail-projet:view-description','detail-projet:view-statut','detail-projet:view-chef',
    'detail-projet:view-debut-prev','detail-projet:view-fin-prev','detail-projet:view-debut-eff','detail-projet:view-fin-eff',
    'detail-projet:view-entites','detail-projet:view-equipe','detail-projet:view-pp',
    'detail-projet:view-taches','detail-projet:view-detail-tache',
    'detail-projet:view-exec','detail-projet:view-gantt',
    'detail-projet:view-detail-tache-tab','detail-projet:view-tache-info',
    'detail-projet:view-tache-libelle','detail-projet:view-tache-description','detail-projet:view-tache-priorite',
    'detail-projet:view-tache-assigne','detail-projet:view-tache-statut-exec','detail-projet:view-tache-statut-av',
    'detail-projet:view-tache-dates-prev','detail-projet:view-tache-dates-eff',
    'detail-projet:view-comments','detail-projet:view-historique',
    'personnes:view','entites:view',
    'profil:view','profil:change-password',
  ]);

  const MEMBRE = new Set([
    ...LECTEUR,
    'detail-projet:view-exec',
    'detail-projet:move-a-faire','detail-projet:move-en-cours','detail-projet:move-termine',
    'detail-projet:move-valide','detail-projet:move-en-attente',
    'detail-projet:save-tache',
    'detail-projet:edit-tache-libelle','detail-projet:edit-tache-description','detail-projet:edit-tache-priorite',
    'detail-projet:edit-tache-assigne','detail-projet:edit-tache-statut-exec','detail-projet:edit-tache-statut-av',
    'detail-projet:edit-tache-dates-prev','detail-projet:edit-tache-dates-eff',
    'detail-projet:add-comment','detail-projet:edit-comment','detail-projet:reply-comment','detail-projet:delete-comment',
  ]);

  const CHEF = new Set([
    ...MEMBRE,
    'projets:create',
    'detail-projet:edit-info',
    'detail-projet:edit-libelle','detail-projet:edit-description','detail-projet:edit-statut','detail-projet:edit-chef',
    'detail-projet:edit-debut-prev','detail-projet:edit-fin-prev','detail-projet:edit-debut-eff','detail-projet:edit-fin-eff',
    'detail-projet:manage-equipe','detail-projet:add-equipe','detail-projet:remove-equipe',
    'detail-projet:create-tache','detail-projet:delete-tache',
    'personnes:create','personnes:update',
  ]);

  const ADMIN = new Set(ALL_PAIRS.map(p => `${p.pageKey}:${p.actionKey}`));

  const active: Record<string, Set<string>> = { lecteur: LECTEUR, membre: MEMBRE, chef: CHEF, admin: ADMIN };
  const enabled = active[role] ?? new Set<string>();
  return ALL_PAIRS.map(p => ({ pageKey: p.pageKey, actionKey: p.actionKey, autorise: enabled.has(`${p.pageKey}:${p.actionKey}`) }));
}

export default function ComptesAccesPage() {
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [comptes, setComptes] = useState<CompteAcces[]>([]);
  const [selectedPersonneId, setSelectedPersonneId] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Suspend
  const [suspendLoading, setSuspendLoading] = useState<string | null>(null);

  // Modal rôle
  const [roleModalId, setRoleModalId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [roleApplying, setRoleApplying] = useState(false);
  const [roleError, setRoleError] = useState('');
  const [roleSuccess, setRoleSuccess] = useState('');

  // Modal mot de passe
  const [mdpModalId, setMdpModalId] = useState<string | null>(null);
  const [mdpValue, setMdpValue] = useState('');
  const [mdpVisible, setMdpVisible] = useState(false);
  const [mdpSaving, setMdpSaving] = useState(false);
  const [mdpError, setMdpError] = useState('');
  const [mdpSuccess, setMdpSuccess] = useState('');

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
      setError('Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const personnesSansCompte = useMemo(() => {
    const ids = new Set(comptes.map(c => c.personne.id));
    return personnes.filter(p => !ids.has(p.id));
  }, [personnes, comptes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); setError('');
    if (!selectedPersonneId) { setError('Sélectionnez une ressource.'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/comptes-acces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personneId: selectedPersonneId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error || 'Erreur de création du compte.'); return; }
      setSelectedPersonneId('');
      setMessage(`Compte créé. Mot de passe par défaut : ${data.motDePasseParDefaut}`);
      await fetchData();
    } catch { setError('Erreur réseau.'); }
    finally { setCreating(false); }
  };

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

  const openRoleModal = (id: string) => {
    setRoleModalId(id);
    setSelectedRole('');
    setRoleError('');
    setRoleSuccess('');
  };

  const handleApplyRole = async () => {
    if (!roleModalId || !selectedRole) return;
    setRoleApplying(true);
    setRoleError('');
    setRoleSuccess('');
    try {
      const permissions = buildRolePermissions(selectedRole);
      const res = await fetch(`/api/comptes-acces/${roleModalId}/autorisations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      });
      const data = await res.json();
      if (!res.ok) { setRoleError(data?.error || 'Erreur lors de l\'application.'); return; }
      setRoleSuccess('Rôle appliqué avec succès.');
      await fetchData();
      setTimeout(() => setRoleModalId(null), 1200);
    } catch { setRoleError('Erreur réseau.'); }
    finally { setRoleApplying(false); }
  };

  const roleModalCompte = roleModalId ? comptes.find(c => c.id === roleModalId) : null;

  const openMdpModal = (id: string) => {
    setMdpModalId(id);
    setMdpValue('');
    setMdpVisible(false);
    setMdpError('');
    setMdpSuccess('');
  };

  const handleChangeMdp = async () => {
    if (!mdpModalId) return;
    const mdp = mdpValue.trim();
    if (mdp.length < 6) { setMdpError('Minimum 6 caractères.'); return; }
    setMdpSaving(true);
    setMdpError('');
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

  return (
    <div className="space-y-6">

      {/* Modal mot de passe */}
      {mdpModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Modifier le mot de passe</h3>
              <button onClick={() => setMdpModalId(null)} className="p-1 rounded hover:bg-slate-100 text-slate-400">
                <X size={16} />
              </button>
            </div>
            {mdpModalCompte && (
              <p className="text-sm text-slate-600">
                <span className="font-semibold">{mdpModalCompte.personne.prenoms} {mdpModalCompte.personne.nom}</span>
              </p>
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
                <button
                  type="button"
                  onClick={() => setMdpVisible(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {mdpVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {mdpError && <p className="text-xs text-red-600">{mdpError}</p>}
            {mdpSuccess && <p className="text-xs text-green-600">{mdpSuccess}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setMdpModalId(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
                Annuler
              </button>
              <button
                onClick={handleChangeMdp}
                disabled={!mdpValue.trim() || mdpSaving}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold"
              >
                {mdpSaving ? 'Modification…' : 'Modifier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal rôle */}
      {roleModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Modifier le rôle</h3>
              <button onClick={() => setRoleModalId(null)} className="p-1 rounded hover:bg-slate-100 text-slate-400">
                <X size={16} />
              </button>
            </div>
            {roleModalCompte && (
              <p className="text-sm text-slate-600">
                <span className="font-semibold">{roleModalCompte.personne.prenoms} {roleModalCompte.personne.nom}</span>
              </p>
            )}
            <div className="space-y-2">
              {ROLES.map(r => (
                <label key={r.key} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedRole === r.key ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="role" value={r.key} checked={selectedRole === r.key} onChange={() => setSelectedRole(r.key)} className="mt-0.5 accent-primary" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{r.label}</p>
                    <p className="text-xs text-slate-500">{r.description}</p>
                  </div>
                </label>
              ))}
            </div>
            {roleError && <p className="text-xs text-red-600">{roleError}</p>}
            {roleSuccess && <p className="text-xs text-green-600">{roleSuccess}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRoleModalId(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
                Annuler
              </button>
              <button
                onClick={handleApplyRole}
                disabled={!selectedRole || roleApplying}
                className="px-4 py-2 text-sm rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold"
              >
                {roleApplying ? 'Application…' : 'Appliquer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Gestion des comptes d'accès</h1>
          <p className="text-sm text-slate-500 mt-1">
            Créer des comptes pour les ressources, puis définir les autorisations par page et action.
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">1. Création de compte utilisateur</h2>
        <p className="mt-1 text-xs text-slate-500">
          Sélectionnez une ressource d'entité. Tous les utilisateurs reçoivent le mot de passe par défaut 0123456789.
          La connexion se fait avec téléphone (10 chiffres) ou email.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full sm:max-w-md">
            <label className="mb-1 block text-xs font-medium text-slate-600">Ressource</label>
            <select
              value={selectedPersonneId}
              onChange={e => setSelectedPersonneId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Sélectionner une ressource</option>
              {personnesSansCompte.map(p => (
                <option key={p.id} value={p.id}>
                  {p.prenoms} {p.nom} - {p.telephone || 'sans tél'} / {p.email} ({p.entite?.libelle || 'Sans entité'})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={creating || !selectedPersonneId}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? 'Création…' : 'Créer le compte'}
          </button>
        </div>
        {message && <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>

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
                  <th className="px-5 py-3">État</th>
                  <th className="px-5 py-3">Dernière connexion</th>
                  <th className="px-5 py-3">Autorisations</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {comptes.map(c => (
                  <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{c.personne.prenoms} {c.personne.nom}</p>
                      <p className="text-xs text-slate-500">{c.personne.telephone || 'Sans téléphone'}</p>
                      <p className="text-xs text-slate-500">{c.personne.email}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{c.personne.entite?.libelle || '—'}</td>
                    <td className="px-5 py-3">
                      {c.estActif ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Actif</span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Suspendu</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {c.dateDerniereConnex
                        ? new Date(c.dateDerniereConnex).toLocaleString('fr-FR')
                        : 'Jamais'}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{c._count?.permissions ?? 0} actions définies</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">

                        {/* Suspendre / Activer */}
                        <button
                          onClick={() => handleSuspend(c.id, c.estActif)}
                          disabled={suspendLoading === c.id}
                          title={c.estActif ? 'Suspendre le compte' : 'Réactiver le compte'}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            c.estActif
                              ? 'text-slate-500 hover:bg-red-50 hover:text-red-600'
                              : 'text-slate-500 hover:bg-green-50 hover:text-green-600'
                          }`}
                        >
                          {c.estActif ? <UserX size={15} /> : <UserCheck size={15} />}
                        </button>

                        {/* Modifier rôle */}
                        <button
                          onClick={() => openRoleModal(c.id)}
                          title="Modifier le rôle"
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
                          title="Gérer les autorisations"
                          className="p-2 rounded-lg text-slate-500 hover:bg-secondary/10 hover:text-secondary transition-colors"
                        >
                          <ShieldCheck size={15} />
                        </Link>

                      </div>
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
