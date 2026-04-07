'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, X, Check, Building2, Users, ChevronRight, ChevronDown, List, Network } from 'lucide-react';

interface Entite {
  id: string;
  libelle: string;
  tutelle?: string;
  typeEntite?: string;
  parentId?: string | null;
  parent?: { id: string; libelle: string } | null;
  personnesRessources: any[];
  partiesPrenantes: any[];
  _count?: { enfants: number };
}

interface EntiteNoeud {
  id: string;
  libelle: string;
  tutelle: string | null;
  typeEntite: string | null;
  parentId: string | null;
  nbPersonnes: number;
  enfants: EntiteNoeud[];
}

const TYPES_SUGGERES = ['Direction', 'Département', 'Service', 'Section', 'Programme', 'Bureau', 'Division', 'Unité'];

const EMPTY_FORM = { libelle: '', tutelle: '', typeEntite: '', parentId: '' };

// ── Composant nœud arbre ──────────────────────────────────────────────
function NoeudArbre({
  noeud, niveau, onEdit, onDelete,
}: {
  noeud: EntiteNoeud;
  niveau: number;
  onEdit: (n: EntiteNoeud) => void;
  onDelete: (id: string, libelle: string) => void;
}) {
  const [ouvert, setOuvert] = useState(niveau < 2);
  const aEnfants = noeud.enfants.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-slate-50 group"
        style={{ paddingLeft: `${niveau * 20 + 12}px` }}
      >
        {/* Toggle enfants */}
        <button
          onClick={() => setOuvert(!ouvert)}
          className={`flex-shrink-0 w-5 h-5 flex items-center justify-center text-slate-400 ${!aEnfants ? 'invisible' : ''}`}
        >
          {ouvert ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <Building2 size={14} className="text-primary flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-slate-800">{noeud.libelle}</span>
          {noeud.typeEntite && (
            <span className="ml-2 text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{noeud.typeEntite}</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 flex-shrink-0">
          <Users size={12} />
          <span>{noeud.nbPersonnes}</span>
        </div>

        <div className="hidden group-hover:flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(noeud)}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-primary"
            title="Modifier"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onDelete(noeud.id, noeud.libelle)}
            className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
            title="Supprimer"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {ouvert && aEnfants && (
        <div>
          {noeud.enfants.map(enfant => (
            <NoeudArbre key={enfant.id} noeud={enfant} niveau={niveau + 1} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────
export default function EntitesPage() {
  const [entites, setEntites]     = useState<Entite[]>([]);
  const [arbre, setArbre]         = useState<EntiteNoeud[]>([]);
  const [vueArbre, setVueArbre]   = useState(false);
  const [loading, setLoading]     = useState(true);

  const [showForm, setShowForm]   = useState(false);
  const [formData, setFormData]   = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  const [editId, setEditId]       = useState<string | null>(null);
  const [editData, setEditData]   = useState(EMPTY_FORM);
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [deleteLibelle, setDeleteLibelle] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [resListe, resArbre] = await Promise.all([
        fetch('/api/entites'),
        fetch('/api/entites/arbre'),
      ]);
      const liste = await resListe.json();
      const arbreData = await resArbre.json();
      setEntites(Array.isArray(liste) ? liste : []);
      setArbre(Array.isArray(arbreData) ? arbreData : []);
    } catch { setEntites([]); setArbre([]); }
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
        body: JSON.stringify({
          libelle: formData.libelle,
          tutelle: formData.tutelle || null,
          typeEntite: formData.typeEntite || null,
          parentId: formData.parentId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data?.error || 'Erreur lors de la création.'); return; }
      await fetchAll();
      setFormData(EMPTY_FORM);
      setShowForm(false);
    } catch { setFormError('Erreur réseau.'); }
    finally { setFormSaving(false); }
  };

  const openEdit = (e: Entite | EntiteNoeud) => {
    setEditId(e.id);
    setEditData({
      libelle: e.libelle,
      tutelle: (e as Entite).tutelle ?? '',
      typeEntite: e.typeEntite ?? '',
      parentId: e.parentId ?? '',
    });
    setEditError('');
  };

  const handleEdit = async (id: string) => {
    setEditError('');
    setEditSaving(true);
    try {
      const res = await fetch(`/api/entites/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          libelle: editData.libelle,
          tutelle: editData.tutelle || null,
          typeEntite: editData.typeEntite || null,
          parentId: editData.parentId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data?.error || 'Erreur lors de la modification.'); return; }
      await fetchAll();
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
      await fetchAll();
      setDeleteId(null);
    } catch { setDeleteError('Erreur réseau.'); }
    finally { setDeleteLoading(false); }
  };

  // Champ parent commun aux formulaires création et édition
  const SelectParent = ({
    value, onChange, excludeId,
  }: { value: string; onChange: (v: string) => void; excludeId?: string }) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">Entité parente</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <option value="">— Aucune (racine) —</option>
        {entites
          .filter(e => e.id !== excludeId)
          .map(e => (
            <option key={e.id} value={e.id}>
              {e.typeEntite ? `[${e.typeEntite}] ` : ''}{e.libelle}
            </option>
          ))}
      </select>
    </div>
  );

  const SelectType = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">Type d'unité</label>
      <input
        list="types-entite"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Direction, Service…"
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <datalist id="types-entite">
        {TYPES_SUGGERES.map(t => <option key={t} value={t} />)}
      </datalist>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Confirmation suppression */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg text-slate-800 mb-2">Supprimer cette entité ?</h3>
            <p className="text-sm text-slate-600 mb-1 font-semibold">{deleteLibelle}</p>
            <p className="text-sm text-slate-500 mb-4">
              Cette action est irréversible. Les personnes rattachées et les sous-entités doivent d'abord être réaffectées.
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
        <div className="flex items-center gap-3">
          {/* Toggle vue */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setVueArbre(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${!vueArbre ? 'bg-white shadow text-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List size={13} /> Liste
            </button>
            <button
              onClick={() => setVueArbre(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${vueArbre ? 'bg-white shadow text-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Network size={13} /> Organigramme
            </button>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setFormError(''); setFormData(EMPTY_FORM); }}
            className="bg-secondary hover:bg-secondary/90 text-white px-6 py-2 rounded-lg font-semibold"
          >
            + Nouvelle entité
          </button>
        </div>
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
            <SelectType value={formData.typeEntite} onChange={v => setFormData({ ...formData, typeEntite: v })} />
            <SelectParent value={formData.parentId} onChange={v => setFormData({ ...formData, parentId: v })} />
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
      ) : vueArbre ? (
        /* ── VUE ARBRE ── */
        <div className="bg-white shadow-sm rounded-2xl border border-slate-200 p-4">
          {arbre.length === 0 ? (
            <p className="text-slate-400 text-sm">Aucune entité créée.</p>
          ) : (
            arbre.map(noeud => (
              <NoeudArbre
                key={noeud.id}
                noeud={noeud}
                niveau={0}
                onEdit={openEdit}
                onDelete={(id, libelle) => { setDeleteId(id); setDeleteLibelle(libelle); setDeleteError(''); }}
              />
            ))
          )}
        </div>
      ) : entites.length === 0 ? (
        <p className="text-slate-400">Aucune entité créée.</p>
      ) : (
        /* ── VUE LISTE ── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {entites.map(entite => (
            <div key={entite.id} className="bg-white shadow-sm rounded-2xl border border-slate-200 p-5">
              {editId === entite.id ? (
                /* Mode édition */
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
                  <SelectType value={editData.typeEntite} onChange={v => setEditData({ ...editData, typeEntite: v })} />
                  <SelectParent value={editData.parentId} onChange={v => setEditData({ ...editData, parentId: v })} excludeId={entite.id} />
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
                /* Mode affichage */
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 size={16} className="text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <h2 className="text-base font-bold text-primary truncate">{entite.libelle}</h2>
                        {entite.typeEntite && (
                          <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{entite.typeEntite}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(entite)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary" title="Modifier">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => { setDeleteId(entite.id); setDeleteLibelle(entite.libelle); setDeleteError(''); }}
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
                  {entite.parent && (
                    <p className="text-xs text-slate-400 mt-1">Sous : {entite.parent.libelle}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Users size={13} />{entite.personnesRessources.length} personne{entite.personnesRessources.length !== 1 ? 's' : ''}</span>
                    {(entite._count?.enfants ?? 0) > 0 && (
                      <span className="flex items-center gap-1"><Network size={13} />{entite._count!.enfants} sous-unité{entite._count!.enfants !== 1 ? 's' : ''}</span>
                    )}
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
