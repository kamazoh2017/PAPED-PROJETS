'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, X, Check, Building2, Users } from 'lucide-react';

interface Entite {
  id: string;
  libelle: string;
  tutelle?: string;
  personnesRessources: any[];
  partiesPrenantes: any[];
}

const EMPTY_FORM = { libelle: '', tutelle: '' };

export default function EntitesPage() {
  const [entites, setEntites]       = useState<Entite[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [formData, setFormData]     = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState('');
  const [formSaving, setFormSaving] = useState(false);

  // Édition
  const [editId, setEditId]         = useState<string | null>(null);
  const [editData, setEditData]     = useState(EMPTY_FORM);
  const [editError, setEditError]   = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Suppression
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchEntites(); }, []);

  const fetchEntites = async () => {
    try {
      const res = await fetch('/api/entites');
      const data = await res.json();
      setEntites(Array.isArray(data) ? data : []);
    } catch { setEntites([]); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSaving(true);
    try {
      const res = await fetch('/api/entites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data?.error || 'Erreur lors de la création.'); return; }
      await fetchEntites();
      setFormData(EMPTY_FORM);
      setShowForm(false);
    } catch { setFormError('Erreur réseau.'); }
    finally { setFormSaving(false); }
  };

  const openEdit = (e: Entite) => {
    setEditId(e.id);
    setEditData({ libelle: e.libelle, tutelle: e.tutelle ?? '' });
    setEditError('');
  };

  const handleEdit = async (id: string) => {
    setEditError('');
    setEditSaving(true);
    try {
      const res = await fetch(`/api/entites/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data?.error || 'Erreur lors de la modification.'); return; }
      await fetchEntites();
      setEditId(null);
    } catch { setEditError('Erreur réseau.'); }
    finally { setEditSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteError('');
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/entites/${deleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data?.error || 'Erreur lors de la suppression.'); return; }
      await fetchEntites();
      setDeleteId(null);
    } catch { setDeleteError('Erreur réseau.'); }
    finally { setDeleteLoading(false); }
  };

  const entiteToDelete = deleteId ? entites.find(e => e.id === deleteId) : null;

  return (
    <div className="space-y-6">

      {/* Confirmation suppression */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg text-slate-800 mb-2">Supprimer cette entité ?</h3>
            <p className="text-sm text-slate-600 mb-1">
              <span className="font-semibold">{entiteToDelete?.libelle}</span>
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Cette action est irréversible. Les personnes rattachées doivent d'abord être réaffectées.
            </p>
            {deleteError && <p className="text-sm text-red-600 mb-3">{deleteError}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setDeleteId(null); setDeleteError(''); }}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 text-slate-700"
              >Annuler</button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
              >{deleteLoading ? 'Suppression…' : 'Supprimer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-primary">Entités</h1>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(''); setFormData(EMPTY_FORM); }}
          className="bg-secondary hover:bg-secondary/90 text-white px-6 py-2 rounded-lg font-semibold"
        >
          + Nouvelle entité
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white shadow-md rounded-xl p-6 space-y-4 border border-slate-200">
          <h2 className="text-base font-bold text-primary">Nouvelle entité</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Libellé <span className="text-red-500">*</span></label>
              <input
                type="text" required
                value={formData.libelle}
                onChange={e => setFormData({ ...formData, libelle: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Nom de l'entité"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tutelle</label>
              <input
                type="text"
                value={formData.tutelle}
                onChange={e => setFormData({ ...formData, tutelle: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Tutelle de l'entité"
              />
            </div>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={formSaving} className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold">
              {formSaving ? 'Création…' : 'Créer'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm">
              Annuler
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-slate-400">Chargement…</p>
      ) : entites.length === 0 ? (
        <p className="text-slate-400">Aucune entité créée.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {entites.map(entite => (
            <div key={entite.id} className="bg-white shadow-sm rounded-2xl border border-slate-200 p-5">
              {editId === entite.id ? (
                /* ── Mode édition ── */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Libellé <span className="text-red-500">*</span></label>
                    <input
                      type="text" required autoFocus
                      value={editData.libelle}
                      onChange={e => setEditData({ ...editData, libelle: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tutelle</label>
                    <input
                      type="text"
                      value={editData.tutelle}
                      onChange={e => setEditData({ ...editData, tutelle: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  {editError && <p className="text-xs text-red-600">{editError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(entite.id)} disabled={editSaving}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg text-xs font-semibold"
                    >
                      <Check size={13} /> {editSaving ? 'Enreg…' : 'Enregistrer'}
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                    >
                      <X size={13} /> Annuler
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Mode affichage ── */
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 size={16} className="text-primary flex-shrink-0" />
                      <h2 className="text-base font-bold text-primary truncate">{entite.libelle}</h2>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(entite)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary"
                        title="Modifier"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => { setDeleteId(entite.id); setDeleteError(''); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {entite.tutelle && (
                    <p className="text-sm text-slate-500 mt-1">Tutelle : {entite.tutelle}</p>
                  )}
                  <div className="flex items-center gap-1 mt-3 text-xs text-slate-400">
                    <Users size={13} />
                    <span>{entite.personnesRessources.length} personne{entite.personnesRessources.length !== 1 ? 's' : ''}</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
