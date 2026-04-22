'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

type Entry = {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'UPSERT' | string;
  login: string | null;
  compteId: string | null;
  dateCree: string;
  avant: Record<string, unknown> | null;
  apres: Record<string, unknown> | null;
};

type Props = {
  table: string;
  id: string;
};

const ACTION_STYLES: Record<string, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UPDATE: 'bg-sky-50 text-sky-700 border-sky-200',
  UPSERT: 'bg-sky-50 text-sky-700 border-sky-200',
  DELETE: 'bg-rose-50 text-rose-700 border-rose-200',
};

const CHAMPS_IGNORES = new Set(['modifieLe', 'modifiePar', 'creeLe', 'creePar', 'dateCreation']);

export default function HistoriqueTimeline({ table, id }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/historique/${table}/${id}`, { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? 'Erreur serveur');
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setEntries(data.entries ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [table, id]);

  function toggle(entryId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  }

  if (loading) return <p className="text-sm text-gray-500">Chargement…</p>;
  if (error) return <p className="text-sm text-rose-600">Erreur : {error}</p>;
  if (entries.length === 0)
    return <p className="text-sm text-gray-500">Aucune modification enregistrée.</p>;

  return (
    <ol className="space-y-3">
      {entries.map((e) => {
        const style = ACTION_STYLES[e.action] ?? 'bg-gray-100 text-gray-700 border-gray-200';
        const isOpen = expanded.has(e.id);
        const changes = computeDiff(e.avant, e.apres);
        return (
          <li key={e.id} className="rounded-lg border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => toggle(e.id)}
              className="flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-gray-50"
            >
              {isOpen ? (
                <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
              ) : (
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded border px-1.5 py-0.5 text-xs font-medium ${style}`}>
                    {e.action}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {e.login ?? e.compteId ?? 'Système'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {new Date(e.dateCree).toLocaleString('fr-FR')}
                </p>
                {!isOpen && changes.length > 0 && (
                  <p className="mt-1 text-xs text-gray-600">
                    {changes.length} champ(s) modifié(s) :{' '}
                    {changes.map((c) => c.key).slice(0, 4).join(', ')}
                    {changes.length > 4 ? '…' : ''}
                  </p>
                )}
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-gray-100 px-3 py-2">
                {changes.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    Aucune différence détectable (ou action CREATE/DELETE).
                  </p>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="text-gray-500">
                      <tr className="border-b border-gray-100">
                        <th className="py-1 pr-2 text-left font-medium">Champ</th>
                        <th className="py-1 pr-2 text-left font-medium">Avant</th>
                        <th className="py-1 text-left font-medium">Après</th>
                      </tr>
                    </thead>
                    <tbody>
                      {changes.map((c) => (
                        <tr key={c.key} className="border-b border-gray-50 align-top">
                          <td className="py-1 pr-2 font-mono text-[11px] text-gray-700">{c.key}</td>
                          <td className="py-1 pr-2 text-gray-500">{formatValue(c.avant)}</td>
                          <td className="py-1 text-gray-900">{formatValue(c.apres)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function computeDiff(
  avant: Record<string, unknown> | null,
  apres: Record<string, unknown> | null
): Array<{ key: string; avant: unknown; apres: unknown }> {
  if (!avant && !apres) return [];
  const keys = new Set<string>([...Object.keys(avant ?? {}), ...Object.keys(apres ?? {})]);
  const changes: Array<{ key: string; avant: unknown; apres: unknown }> = [];
  for (const k of keys) {
    if (CHAMPS_IGNORES.has(k)) continue;
    const av = avant?.[k];
    const ap = apres?.[k];
    if (JSON.stringify(av) !== JSON.stringify(ap)) {
      changes.push({ key: k, avant: av, apres: ap });
    }
  }
  return changes.sort((a, b) => a.key.localeCompare(b.key));
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') {
    const s = /^\d{4}-\d{2}-\d{2}T/.test(v) ? new Date(v).toLocaleString('fr-FR') : v;
    return s.length > 60 ? s.slice(0, 57) + '…' : s;
  }
  if (typeof v === 'boolean') return v ? 'oui' : 'non';
  if (typeof v === 'number') return String(v);
  const s = JSON.stringify(v);
  return s.length > 60 ? s.slice(0, 57) + '…' : s;
}
