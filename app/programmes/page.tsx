'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, X, Briefcase, Building2, Calendar, Coins } from 'lucide-react';

interface Entite { id: string; libelle: string; typeEntite?: string | null }

interface Programme {
  id: string;
  libelle: string;
  code: string | null;
  description: string | null;
  bailleur: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  budgetTotal: number | null;
  devise: string;
  statut: string;
  entite: Entite | null;
  _count: { projets: number };
}

const STATUTS = ['Actif', 'Clôturé', 'Archivé'];
const STATUT_STYLE: Record<string, string> = {
  Actif:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  Clôturé:  'bg-slate-100 text-slate-600 border-slate-200',
  Archivé:  'bg-amber-50 text-amber-700 border-amber-200',
};

const EMPTY = {
  libelle: '', code: '', description: '', bailleur: '',
  dateDebut: '', dateFin: '', budgetTotal: '', devise: 'XOF',
  statut: 'Actif', entiteId: '',
};

function toInputDate(d: string | null) { return d ? d.slice(0, 10) : ''; }
function fmtDate(d: string | null) { return d ? new Date(d).toLocaleDateString('fr-FR') : '—'; }
function fmtMoney(n: number | null, devise: string) {
  if (n === null) return '—';
  return new Intl.NumberFormat('fr-FR').format(n) + ' ' + devise;
}

export default function ProgrammesPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [entites, setEntites] = useState<Entite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [filterStatut, setFilterStatut] = useState<string>('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [pgRes, enRes] = await Promise.all([
        fetch('/api/programmes', { credentials: 'include' }),
        fetch('/api/entites', { credentials: 'include' }),
      ]);
      if (pgRes.ok) setProgrammes(await pgRes.json());
      if (enRes.ok) setEntites(await enRes.json());
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY);
    setError(null);
    setShowForm(true);
  }

  function openEdit(p: Programme) {
    setEditId(p.id);
    setForm({
      libelle: p.libelle,
      code: p.code ?? '',
      description: p.description ?? '',
      bailleur: p.bailleur ?? '',
      dateDebut: toInputDate(p.dateDebut),
      dateFin: toInputDate(p.dateFin),
      budgetTotal: p.budgetTotal !== null ? String(p.budgetTotal) : '',
      devise: p.devise,
      statut: p.statut,
      entiteId: p.entite?.id ?? '',
    });
    setError(null);
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const url = editId ? `/api/programmes/${editId}` : '/api/programmes';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur serveur.');
      return;
    }
    setShowForm(false);
    setForm(EMPTY);
    load();
  }

  async function remove(p: Programme) {
    if (!confirm(`Supprimer le programme "${p.libelle}" ?`)) return;
    const res = await fetch(`/api/programmes/${p.id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Erreur lors de la suppression.');
      return;
    }
    load();
  }

  const filtered = programmes.filter(p => {
    if (filterStatut && p.statut !== filterStatut) return false;
    if (search) {
      const s = search.toLowerCase();
      const target = `${p.libelle} ${p.code ?? ''} ${p.bailleur ?? ''}`.toLowerCase();
      if (!target.includes(s)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Briefcase size={22} /> Programmes
        </h1>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary"
        >
          <Plus size={16} /> Nouveau programme
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3">
        <input
          type="text"
          placeholder="Rechercher (libellé, code, bailleur)…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[220px] px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
        />
        <select
          value={filterStatut}
          onChange={e => setFilterStatut(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
        >
          <option value="">Tous les statuts</option>
          {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} programme(s)</span>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 py-10 text-center">Chargement…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
          <p className="text-sm text-slate-500">Aucun programme à afficher.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <Link href={`/programmes/${p.id}`} className="block">
                    <h2 className="font-semibold text-slate-800 hover:text-primary truncate">{p.libelle}</h2>
                  </Link>
                  {p.code && <p className="text-xs text-slate-400 font-mono">{p.code}</p>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUT_STYLE[p.statut] ?? 'border-slate-200 text-slate-600'}`}>
                  {p.statut}
                </span>
              </div>

              {p.bailleur && <p className="text-xs text-slate-500 mb-1.5">🏛 {p.bailleur}</p>}

              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-500 my-2">
                {p.entite && (
                  <span className="col-span-2 truncate"><Building2 size={11} className="inline mr-1" />{p.entite.libelle}</span>
                )}
                <span><Calendar size={11} className="inline mr-1" />Début : {fmtDate(p.dateDebut)}</span>
                <span><Calendar size={11} className="inline mr-1" />Fin : {fmtDate(p.dateFin)}</span>
                {p.budgetTotal !== null && (
                  <span className="col-span-2"><Coins size={11} className="inline mr-1" />{fmtMoney(p.budgetTotal, p.devise)}</span>
                )}
              </div>

              <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                <Link href={`/programmes/${p.id}`} className="text-xs text-primary hover:underline">
                  {p._count.projets} projet{p._count.projets > 1 ? 's' : ''}
                </Link>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-primary rounded hover:bg-slate-50" title="Modifier">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => remove(p)} className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-red-50" title="Supprimer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal créer/éditer */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={save} className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <header className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
              <h2 className="font-bold text-slate-800">{editId ? 'Modifier le programme' : 'Nouveau programme'}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-slate-100">
                <X size={18} />
              </button>
            </header>

            <div className="p-5 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Libellé *</label>
                <input required value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Code</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
                  placeholder="ex. PROG-SANTE-2028"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Statut</label>
                <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Bailleur</label>
                <input value={form.bailleur} onChange={e => setForm({ ...form, bailleur: e.target.value })}
                  placeholder="ex. UE - FED 11"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date début</label>
                <input type="date" value={form.dateDebut} onChange={e => setForm({ ...form, dateDebut: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date fin</label>
                <input type="date" value={form.dateFin} onChange={e => setForm({ ...form, dateFin: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Budget total</label>
                <input type="number" step="0.01" value={form.budgetTotal} onChange={e => setForm({ ...form, budgetTotal: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Devise</label>
                <input value={form.devise} onChange={e => setForm({ ...form, devise: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Entité pilote</label>
                <select value={form.entiteId} onChange={e => setForm({ ...form, entiteId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option value="">— Aucune —</option>
                  {entites.map(en => (
                    <option key={en.id} value={en.id}>{en.typeEntite ? `[${en.typeEntite}] ` : ''}{en.libelle}</option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
              )}
            </div>

            <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 bg-slate-50">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg">
                Annuler
              </button>
              <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-secondary rounded-lg">
                {editId ? 'Enregistrer' : 'Créer'}
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}
