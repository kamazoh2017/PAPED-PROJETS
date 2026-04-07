'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PERMISSIONS_CATALOG, PermNodeDef, flattenPermissions } from '@/lib/permissions-catalog';
import { ROLE_LABELS, type RoleKey } from '@/lib/roles-permissions';
import { RotateCcw } from 'lucide-react';

interface Compte {
  id: string;
  role: string;
  personne: { nom: string; prenoms: string; telephone?: string; email: string };
}

const ALL_PAIRS = flattenPermissions(PERMISSIONS_CATALOG);

function nodeAllPairs(node: PermNodeDef): { pageKey: string; actionKey: string }[] {
  return flattenPermissions([node]);
}

// ── Ligne arborescente ────────────────────────────────────────────────────────

function TreeRow({
  node, depth, granted, roleDefaults, isOverridden, onToggle,
}: {
  node: PermNodeDef;
  depth: number;
  granted: Record<string, boolean>;
  roleDefaults: Record<string, boolean>;
  isOverridden: Record<string, boolean>;
  onToggle: (pageKey: string, actionKey: string) => void;
}) {
  const pairs = nodeAllPairs(node);
  const allOn  = pairs.every(p => granted[`${p.pageKey}:${p.actionKey}`]);
  const someOn = pairs.some(p => granted[`${p.pageKey}:${p.actionKey}`]);

  const toggleAll = () => {
    const next = !allOn;
    pairs.forEach(p => {
      if (granted[`${p.pageKey}:${p.actionKey}`] !== next) onToggle(p.pageKey, p.actionKey);
    });
  };

  const padLeft = depth * 24 + 12;
  const isFlat = !node.children || node.children.length === 0;

  const actionCheckboxes = node.actions.map(action => {
    const key = `${node.pageKey}:${action.key}`;
    const isDefault  = roleDefaults[key] ?? false;
    const isOverride = isOverridden[key] ?? false;
    const isGranted  = granted[key] ?? false;

    return (
      <label key={key} className="flex items-center gap-1.5 cursor-pointer select-none group relative" title={
        isOverride
          ? (isGranted ? '✓ Surcharge manuelle (accordée)' : '✗ Surcharge manuelle (révoquée)')
          : (isDefault ? '✓ Accordée par le rôle' : '✗ Non accordée par le rôle')
      }>
        <input
          type="checkbox"
          checked={isGranted}
          onChange={() => onToggle(node.pageKey, action.key)}
          className="h-3.5 w-3.5 accent-primary"
        />
        <span className={`text-xs ${isGranted ? 'text-slate-700' : 'text-slate-400'}`}>
          {action.label}
        </span>
        {/* Indicateur de surcharge */}
        {isOverride && (
          <span
            className={`text-[9px] font-bold px-1 rounded-full ${isGranted ? 'bg-violet-100 text-violet-600' : 'bg-red-100 text-red-500'}`}
            title="Surcharge individuelle"
          >
            {isGranted ? '+' : '−'}
          </span>
        )}
      </label>
    );
  });

  return (
    <>
      <tr className="border-b border-slate-100 hover:bg-slate-50/50">
        <td className={`py-2 pr-4 align-middle${isFlat ? ' w-full' : ''}`} style={{ paddingLeft: padLeft }} colSpan={isFlat ? 2 : 1}>
          <div className="flex items-center gap-2 flex-wrap">
            {!isFlat ? (
              <input
                type="checkbox"
                checked={allOn}
                ref={el => { if (el) el.indeterminate = someOn && !allOn; }}
                onChange={toggleAll}
                className="h-3.5 w-3.5 accent-primary flex-shrink-0"
                title="Tout cocher / décocher"
              />
            ) : null}
            <span className={`text-sm ${depth === 0 ? 'font-semibold text-slate-800' : depth === 1 ? 'font-medium text-slate-700' : 'text-slate-600'}`}>
              {node.label}
            </span>
            {isFlat && <div className="flex flex-wrap gap-x-4 gap-y-1 ml-2">{actionCheckboxes}</div>}
          </div>
        </td>
        {!isFlat && (
          <td className="py-2 pl-2 align-middle">
            <div className="flex flex-wrap gap-x-4 gap-y-1">{actionCheckboxes}</div>
          </td>
        )}
      </tr>
      {node.children?.map(child => (
        <TreeRow
          key={`${child.pageKey}-${child.label}`}
          node={child}
          depth={depth + 1}
          granted={granted}
          roleDefaults={roleDefaults}
          isOverridden={isOverridden}
          onToggle={onToggle}
        />
      ))}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, { bg: string; text: string }> = {
  AGENT:          { bg: 'bg-slate-100',  text: 'text-slate-600'  },
  GESTIONNAIRE:   { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  COORDINATEUR:   { bg: 'bg-violet-100', text: 'text-violet-700' },
  ADMINISTRATEUR: { bg: 'bg-amber-100',  text: 'text-amber-700'  },
};

export default function AutorisationsComptePage() {
  const params = useParams();
  const id = params.id as string;

  const [compte, setCompte]       = useState<Compte | null>(null);
  const [role, setRole]           = useState<RoleKey>('AGENT');
  const [granted, setGranted]     = useState<Record<string, boolean>>({});
  const [roleDefaults, setRoleDefaults] = useState<Record<string, boolean>>({});
  const [isOverridden, setIsOverridden] = useState<Record<string, boolean>>({});
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [message, setMessage]     = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/comptes-acces/${id}/autorisations`);
      const data = await r.json();
      setCompte(data.compte ?? null);
      setRole((data.role ?? 'AGENT') as RoleKey);
      setGranted(data.granted ?? {});
      setRoleDefaults(data.roleDefaults ?? {});
      setIsOverridden(data.isOverridden ?? {});
    } catch { setError('Erreur de chargement.'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const onToggle = useCallback((pageKey: string, actionKey: string) => {
    setGranted(prev => ({ ...prev, [`${pageKey}:${actionKey}`]: !prev[`${pageKey}:${actionKey}`] }));
  }, []);

  // Réinitialiser aux défauts du rôle
  const resetToRoleDefaults = () => {
    setGranted({ ...roleDefaults });
  };

  const totalOn  = useMemo(() => ALL_PAIRS.filter(p => granted[`${p.pageKey}:${p.actionKey}`]).length, [granted]);
  const overrideCount = useMemo(() => ALL_PAIRS.filter(p => {
    const key = `${p.pageKey}:${p.actionKey}`;
    return granted[key] !== (roleDefaults[key] ?? false);
  }).length, [granted, roleDefaults]);

  const handleSave = async () => {
    setSaving(true); setMessage(''); setError('');
    try {
      const permissions = ALL_PAIRS.map(p => ({
        pageKey: p.pageKey, actionKey: p.actionKey,
        autorise: granted[`${p.pageKey}:${p.actionKey}`] ?? false,
      }));
      const res = await fetch(`/api/comptes-acces/${id}/autorisations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error || 'Erreur de sauvegarde.'); return; }
      setMessage('Surcharges enregistrées.');
      // Recharger pour avoir les isOverridden à jour
      await load();
    } catch { setError('Erreur réseau.'); }
    finally { setSaving(false); }
  };

  if (loading) return <p className="text-sm text-slate-500 p-6">Chargement…</p>;

  const badge = ROLE_BADGE[role] ?? ROLE_BADGE.AGENT;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Autorisations détaillées</h1>
          {compte && (
            <p className="mt-1 text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{compte.personne.prenoms} {compte.personne.nom}</span>
              {' · '}{compte.personne.telephone || '—'}
              {' · '}{compte.personne.email}
            </p>
          )}
        </div>
        <Link href="/comptes-acces" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 flex-shrink-0">
          ← Retour
        </Link>
      </div>

      {/* Bandeau rôle actuel */}
      <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 px-5 py-3 shadow-sm flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Rôle actuel :</span>
          <span className={`text-sm font-bold px-3 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
            {ROLE_LABELS[role] ?? role}
          </span>
        </div>
        <div className="h-4 w-px bg-slate-200 hidden sm:block" />
        <p className="text-xs text-slate-500">
          Actions accordées : <strong className="text-primary">{totalOn}</strong> / {ALL_PAIRS.length}
          {overrideCount > 0 && (
            <span className="ml-2 text-violet-600 font-semibold">· {overrideCount} surcharge{overrideCount > 1 ? 's' : ''}</span>
          )}
        </p>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={resetToRoleDefaults}
            title="Réinitialiser aux défauts du rôle"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw size={12} />
            Défauts du rôle
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 px-5 py-1.5 text-sm font-semibold text-white"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer les surcharges'}
          </button>
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4 text-xs text-slate-500 px-1 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-primary/20 border border-primary/40" />
          Accordé par le rôle
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold px-1 rounded-full bg-violet-100 text-violet-600">+</span>
          Surcharge accordée (en plus du rôle)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold px-1 rounded-full bg-red-100 text-red-500">−</span>
          Surcharge révoquée (retiré du rôle)
        </span>
      </div>

      {error   && <p className="rounded-lg bg-red-50   px-4 py-2 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{message}</p>}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="py-2 px-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-2/5">Élément</th>
              <th className="py-2 px-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS_CATALOG.map(node => (
              <TreeRow
                key={`${node.pageKey}-${node.label}`}
                node={node}
                depth={0}
                granted={granted}
                roleDefaults={roleDefaults}
                isOverridden={isOverridden}
                onToggle={onToggle}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
