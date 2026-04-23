'use client';

import { useState } from 'react';
import { History, X } from 'lucide-react';
import HistoriqueTimeline from './HistoriqueTimeline';

type Props = {
  table: string;
  id: string;
  titre?: string;
};

export default function HistoriqueDrawer({ table, id, titre }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
      >
        <History className="h-4 w-4" />
        Historique
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="flex h-full w-full max-w-xl flex-col bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Historique des modifications</h2>
                <p className="text-xs text-gray-500">
                  {titre ? `${titre} · ` : ''}
                  {table} · {id.slice(0, 8)}…
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {open && <HistoriqueTimeline table={table} id={id} />}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
