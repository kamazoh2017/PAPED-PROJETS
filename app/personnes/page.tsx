'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, X, Check } from 'lucide-react';

interface Personne {
  id: string;
  nom: string;
  prenoms: string;
  email: string;
  fonction: string;
  telephone?: string;
  entiteId: string;
  entite: { libelle: string };
}

interface EntiteOption {
  id: string;
  libelle: string;
}

const EMPTY_FORM = { nom: '', prenoms: '', email: '', fonction: '', telephone: '', entiteId: '' };

export default function PersonnesPage() {
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [entites, setEntites] = useState<EntiteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  // Édition
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState(EMPTY_FORM);
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Suppression
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchPersonnes();
    fetchEntites();
  }, []);

  const fetchPersonnes = async () => {
    try {
      const res = await fetch('/api/personnes');
      const data = await res.json();
      setPersonnes(Array.isArray(data) ? data : []);
    } catch { setPersonnes([]); }
    finally { setLoading(false); }
  };

  const fetchEntites = async () => {
    try {
      const res = await fetch('/api/entites');
      const data = await res.json();
      setEntites(Array.isArray(data) ? data : []);
    } catch { setEntites([]); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const telephone = formData.telephone.replace(/\D/g, '');
    if (telephone.length !== 10) {
      setFormError('Le numéro de téléphone doit contenir exactement 10 chiffres.');
      return;
    }
    setFormSaving(true);
    try {
      const res = await fetch('/api/personnes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, email: formData.email.trim().toLowerCase(), telephone }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data?.error || 'Erreur lors de la création.'); return; }
      await fetchPersonnes();
      setFormData(EMPTY_FORM);
      setShowForm(false);
    } catch { setFormError('Erreur réseau.'); }
    finally { setFormSaving(false); }
  };

  const openEdit = (p: Personne) => {
    setEditId(p.id);
    setEditData({ nom: p.nom, prenoms: p.prenoms, email: p.email, fonction: p.fonction, telephone: p.telephone ?? '', entiteId: p.entiteId });
    setEditError('');
  };

  const handleEdit = async (id: string) => {
    setEditError('');
    const telephone = editData.telephone.replace(/\D/g, '');
    if (telephone.length !== 10) {
      setEditError('Le numéro de téléphone doit contenir exactement 10 chiffres.');
      return;
    }
    setEditSaving(true);
    try {
      const res = await fetch(`/api/personnes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editData, email: editData.email.trim().toLowerCase(), telephone }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data?.error || 'Erreur lors de la modification.'); return; }
      await fetchPersonnes();
      setEditId(null);
    } catch { setEditError('Erreur réseau.'); }
    finally { setEditSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteError('');
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/personnes/${deleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data?.error || 'Erreur lors de la suppression.'); return; }
      await fetchPersonnes();
      setDeleteId(null);
    } catch { setDeleteError('Erreur réseau.'); }
    finally { setDeleteLoading(false); }
  };

  const personneToDelete = deleteId ? personnes.find(p => p.id === deleteId) : null;

  return (
    <div className="space-y-6">

      {/* Confirmation suppression */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg text-slate-800 mb-2">Supprimer cette personne ?</h3>
            <p className="text-sm text-slate-600 mb-1">
              <span className="font-semibold">{personneToDelete?.nom} {personneToDelete?.prenoms}</span>
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Cette action est irréversible.
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
        <h1 className="text-4xl font-bold text-primary">Personnes ressources</h1>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(''); setFormData(EMPTY_FORM); }}
          className="bg-secondary hover:bg-secondary/90 text-white px-6 py-2 rounded-lg font-semibold"
        >
          + Nouvelle personne
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white shadow-md rounded-xl p-6 space-y-4 border border-slate-200">
          <h2 className="text-base font-bold text-primary">Nouvelle personne ressource</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.nom}
                onChange={e => setFormData({ ...formData, nom: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Prénoms <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.prenoms}
                onChange={e => setFormData({ ...formData, prenoms: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
              <input type="email" required value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Téléphone (10 chiffres) <span className="text-red-500">*</span></label>
              <input type="tel" required inputMode="numeric" pattern="[0-9]{10}" value={formData.telephone}
                onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                placeholder="Ex: 0701020304"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fonction <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.fonction}
                onChange={e => setFormData({ ...formData, fonction: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Entité <span className="text-red-500">*</span></label>
              <select required value={formData.entiteId}
                onChange={e => setFormData({ ...formData, entiteId: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="">Sélectionner une entité</option>
                {entites.map(e => <option key={e.id} value={e.id}>{e.libelle}</option>)}
              </select>
            </div>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={formSaving}
              className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold">
              {formSaving ? 'Création…' : 'Créer'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm">
              Annuler
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-slate-400">Chargement…</p>
      ) : personnes.length === 0 ? (
        <p className="text-slate-400">Aucune personne ressource créée.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white shadow-md rounded-xl border border-slate-200 overflow-hidden">
            <thead className="bg-primary text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Nom</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Prénoms</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Téléphone</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Fonction</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Entité</th>
                <th className="px-4 py-3 text-center text-sm font-semibold w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {personnes.map(p => (
                editId === p.id ? (
                  /* ── Mode édition ── */
                  <tr key={p.id} className="border-b bg-slate-50">
                    <td className="px-2 py-2">
                      <input type="text" autoFocus value={editData.nom}
                        onChange={e => setEditData({ ...editData, nom: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" value={editData.prenoms}
                        onChange={e => setEditData({ ...editData, prenoms: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </td>
                    <td className="px-2 py-2">
                      <input type="email" value={editData.email}
                        onChange={e => setEditData({ ...editData, email: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </td>
                    <td className="px-2 py-2">
                      <input type="tel" inputMode="numeric" value={editData.telephone}
                        onChange={e => setEditData({ ...editData, telephone: e.target.value })}
                        placeholder="0701020304"
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </td>
                    <td className="px-2 py-2">
                      <input type="text" value={editData.fonction}
                        onChange={e => setEditData({ ...editData, fonction: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </td>
                    <td className="px-2 py-2">
                      <select value={editData.entiteId}
                        onChange={e => setEditData({ ...editData, entiteId: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                        <option value="">— Entité —</option>
                        {entites.map(e => <option key={e.id} value={e.id}>{e.libelle}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-col gap-1 items-center">
                        {editError && <p className="text-xs text-red-600 text-center">{editError}</p>}
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(p.id)} disabled={editSaving}
                            className="p-1.5 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-white" title="Enregistrer">
                            <Check size={13} />
                          </button>
                          <button onClick={() => setEditId(null)}
                            className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700" title="Annuler">
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  /* ── Mode affichage ── */
                  <tr key={p.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm">{p.nom}</td>
                    <td className="px-4 py-3 text-sm">{p.prenoms}</td>
                    <td className="px-4 py-3 text-sm">{p.email}</td>
                    <td className="px-4 py-3 text-sm">{p.telephone || '—'}</td>
                    <td className="px-4 py-3 text-sm">{p.fonction}</td>
                    <td className="px-4 py-3 text-sm">{p.entite.libelle}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary" title="Modifier">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => { setDeleteId(p.id); setDeleteError(''); }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600" title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
