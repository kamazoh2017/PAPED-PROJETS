'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PERMISSIONS_CATALOG, PermNodeDef, flattenPermissions } from '@/lib/permissions-catalog';

interface Compte {
  id: string;
  personne: { nom: string; prenoms: string; telephone?: string; email: string };
}

// ── Flatten all pairs from the catalog ────────────────────────────────────────
const ALL_PAIRS = flattenPermissions(PERMISSIONS_CATALOG);

// ── Get all pairs under a node (recursively) ──────────────────────────────────
function nodeAllPairs(node: PermNodeDef): { pageKey: string; actionKey: string }[] {
  return flattenPermissions([node]);
}

// ── Recursive tree row ─────────────────────────────────────────────────────────
function TreeRow({
  node, depth, granted, onToggle,
}: {
  node: PermNodeDef;
  depth: number;
  granted: Record<string, boolean>;
  onToggle: (pageKey: string, actionKey: string) => void;
}) {
  const pairs = nodeAllPairs(node);
  const allOn  = pairs.every(p => granted[`${p.pageKey}:${p.actionKey}`]);
  const someOn = pairs.some(p => granted[`${p.pageKey}:${p.actionKey}`]);

  const toggleAll = () => {
    const next = !allOn;
    pairs.forEach(p => {
      if (granted[`${p.pageKey}:${p.actionKey}`] !== next) {
        onToggle(p.pageKey, p.actionKey);
      }
    });
  };

  const padLeft = depth * 24 + 12;
  const isFlat = !node.children || node.children.length === 0;

  const actionCheckboxes = node.actions.map(action => {
    const key = `${node.pageKey}:${action.key}`;
    return (
      <label key={key} className="flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={granted[key] ?? false}
          onChange={() => onToggle(node.pageKey, action.key)}
          className="h-3.5 w-3.5 accent-primary"
        />
        <span className="text-xs text-slate-600">{action.label}</span>
      </label>
    );
  });

  return (
    <>
      <tr className="border-b border-slate-100 hover:bg-slate-50/50">
        {/* Element column */}
        <td className={`py-2 pr-4 align-middle${isFlat ? ' w-full' : ''}`} style={{ paddingLeft: padLeft }} colSpan={isFlat ? 2 : 1}>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Section toggle (only for nodes with children) */}
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
            {/* Inline checkboxes for flat nodes */}
            {isFlat && <div className="flex flex-wrap gap-x-4 gap-y-1 ml-2">{actionCheckboxes}</div>}
          </div>
        </td>
        {/* Actions column — only for nodes with children */}
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
          onToggle={onToggle}
        />
      ))}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AutorisationsComptePage() {
  const params = useParams();
  const id = params.id as string;

  const [compte, setCompte] = useState<Compte | null>(null);
  const [granted, setGranted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/comptes-acces/${id}/autorisations`)
      .then(r => r.json())
      .then(data => {
        setCompte(data.compte ?? null);
        setGranted(data.granted ?? {});
      })
      .catch(() => setError('Erreur de chargement.'))
      .finally(() => setLoading(false));
  }, [id]);

  const onToggle = useCallback((pageKey: string, actionKey: string) => {
    setGranted(prev => ({ ...prev, [`${pageKey}:${actionKey}`]: !prev[`${pageKey}:${actionKey}`] }));
  }, []);

  const totalOn  = useMemo(() => ALL_PAIRS.filter(p => granted[`${p.pageKey}:${p.actionKey}`]).length, [granted]);
  const totalAll = ALL_PAIRS.length;
  const allOn    = totalOn === totalAll;

  const toggleAll = () => {
    const next = !allOn;
    setGranted(prev => {
      const updated = { ...prev };
      ALL_PAIRS.forEach(p => { updated[`${p.pageKey}:${p.actionKey}`] = next; });
      return updated;
    });
  };

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
      setMessage('Autorisations enregistrées avec succès.');
    } catch { setError('Erreur réseau.'); }
    finally { setSaving(false); }
  };

  if (loading) return <p className="text-sm text-slate-500 p-6">Chargement…</p>;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Autorisations</h1>
          {compte && (
            <p className="mt-1 text-sm text-slate-500">
              {compte.personne.prenoms} {compte.personne.nom}
              {' · '}{compte.personne.telephone || '—'}
              {' · '}{compte.personne.email}
            </p>
          )}
        </div>
        <Link href="/comptes-acces" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 flex-shrink-0">
          ← Retour
        </Link>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 px-5 py-3 shadow-sm">
        <p className="text-sm text-slate-600">
          Actions autorisées : <strong className="text-primary">{totalOn}</strong>
          <span className="text-slate-400"> / {totalAll}</span>
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleAll}
            className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {allOn ? 'Tout décocher' : 'Tout cocher'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 px-5 py-1.5 text-sm font-semibold text-white"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {error   && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
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
                onToggle={onToggle}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
