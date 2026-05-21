'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Target, ListChecks, X, Loader2, Link2 } from 'lucide-react';

interface Personne { id: string; nom: string; prenoms: string }

interface Activite {
  id: string;
  resultatId: string;
  parentActiviteId: string | null;
  code: string;
  libelle: string;
  description: string | null;
  responsable: Personne | null;
  dateDebutPrev: string | null;
  dateFinPrev: string | null;
  dateDebutEff: string | null;
  dateFinEff: string | null;
  statut: string;
  progression: number;
  ordre: number;
  enfants?: Activite[];
  _count?: { taches: number; enfants: number };
}

interface Resultat {
  id: string;
  projetId: string;
  code: string;
  libelle: string;
  description: string | null;
  ordre: number;
  activites: Activite[];
}

const STATUT_ACT_STYLE: Record<string, string> = {
  'Planifiée': 'bg-slate-100 text-slate-600 border-slate-200',
  'En cours':  'bg-sky-50 text-sky-700 border-sky-200',
  'Terminée':  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Suspendue': 'bg-amber-50 text-amber-700 border-amber-200',
  'Annulée':   'bg-rose-50 text-rose-700 border-rose-200',
};
const STATUTS_ACT = ['Planifiée', 'En cours', 'Terminée', 'Suspendue', 'Annulée'];

export default function CadreLogiqueTree({ projetId, canEdit }: { projetId: string; canEdit: boolean }) {
  const [resultats, setResultats] = useState<Resultat[]>([]);
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Modales
  const [resultatForm, setResultatForm] = useState<{ id?: string; code: string; libelle: string; description: string } | null>(null);
  const [activiteForm, setActiviteForm] = useState<{
    id?: string;
    resultatId: string;
    parentActiviteId?: string | null;
    code: string;
    libelle: string;
    description: string;
    responsableId: string;
    dateDebutPrev: string;
    dateFinPrev: string;
    statut: string;
    progression: number;
  } | null>(null);
  const [rattachActivite, setRattachActivite] = useState<Activite | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([
        fetch(`/api/projets/${projetId}/resultats`, { credentials: 'include' }),
        fetch('/api/personnes', { credentials: 'include' }),
      ]);
      if (r.ok) setResultats(await r.json());
      if (p.ok) setPersonnes(await p.json());
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [projetId]);

  function toggle(id: string) {
    setExpanded(p => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  // ── CRUD Résultat ──────────────────────────────────────────────
  function openCreateResultat() {
    setResultatForm({ code: `R${resultats.length + 1}`, libelle: '', description: '' });
    setError(null);
  }
  function openEditResultat(r: Resultat) {
    setResultatForm({ id: r.id, code: r.code, libelle: r.libelle, description: r.description ?? '' });
    setError(null);
  }
  async function saveResultat(e: React.FormEvent) {
    e.preventDefault();
    if (!resultatForm) return;
    const url = resultatForm.id ? `/api/resultats/${resultatForm.id}` : `/api/projets/${projetId}/resultats`;
    const method = resultatForm.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultatForm),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Erreur serveur.');
      return;
    }
    setResultatForm(null);
    load();
  }
  async function deleteResultat(r: Resultat) {
    if (!confirm(`Supprimer le résultat "${r.code} - ${r.libelle}" ?`)) return;
    const res = await fetch(`/api/resultats/${r.id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || 'Erreur.');
      return;
    }
    load();
  }

  // ── CRUD Activité ──────────────────────────────────────────────
  function openCreateActivite(resultatId: string, parentActiviteId: string | null = null, codeHint = 'A1.1') {
    setActiviteForm({
      resultatId, parentActiviteId,
      code: codeHint, libelle: '', description: '',
      responsableId: '', dateDebutPrev: '', dateFinPrev: '',
      statut: 'Planifiée', progression: 0,
    });
    setError(null);
  }
  function openEditActivite(a: Activite) {
    setActiviteForm({
      id: a.id, resultatId: a.resultatId, parentActiviteId: a.parentActiviteId,
      code: a.code, libelle: a.libelle, description: a.description ?? '',
      responsableId: a.responsable?.id ?? '',
      dateDebutPrev: a.dateDebutPrev?.slice(0, 10) ?? '',
      dateFinPrev:   a.dateFinPrev?.slice(0, 10) ?? '',
      statut: a.statut, progression: a.progression,
    });
    setError(null);
  }
  async function saveActivite(e: React.FormEvent) {
    e.preventDefault();
    if (!activiteForm) return;
    const url = activiteForm.id ? `/api/activites/${activiteForm.id}` : `/api/resultats/${activiteForm.resultatId}/activites`;
    const method = activiteForm.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activiteForm),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Erreur serveur.');
      return;
    }
    setActiviteForm(null);
    load();
  }
  async function deleteActivite(a: Activite) {
    if (!confirm(`Supprimer l'activité "${a.code} - ${a.libelle}" ?`)) return;
    const res = await fetch(`/api/activites/${a.id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || 'Erreur.');
      return;
    }
    load();
  }

  if (loading) return <p className="text-sm text-slate-500 py-6 text-center">Chargement du cadre logique…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
          <Target size={18} /> Cadre logique
        </h2>
        {canEdit && (
          <button
            onClick={openCreateResultat}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary px-3 py-1.5 text-sm text-primary hover:bg-primary/5"
          >
            <Plus size={14} /> Nouveau résultat
          </button>
        )}
      </div>

      {resultats.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl py-10 text-center text-sm text-slate-500">
          Aucun résultat attendu défini.
          {canEdit && <span className="block mt-1 text-xs">Créez un premier résultat pour structurer votre projet.</span>}
        </div>
      ) : (
        <ol className="space-y-2">
          {resultats.map(r => {
            const isOpen = expanded.has(r.id);
            return (
              <li key={r.id} className="bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-xl group">
                  <button onClick={() => toggle(r.id)} className="text-slate-400 hover:text-slate-700 shrink-0">
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <span className="font-mono text-xs text-slate-500 shrink-0 w-12">{r.code}</span>
                  <span className="flex-1 text-sm font-semibold text-slate-800 truncate">{r.libelle}</span>
                  <span className="text-xs text-slate-400 shrink-0">{r.activites.length} activité(s)</span>
                  {canEdit && (
                    <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                      <button onClick={() => openCreateActivite(r.id, null, `A${r.code.replace(/\D/g, '')}.${(r.activites.length + 1)}`)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-primary" title="Nouvelle activité">
                        <Plus size={13} />
                      </button>
                      <button onClick={() => openEditResultat(r)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-primary" title="Modifier">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteResultat(r)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500" title="Supprimer">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {isOpen && (
                  <div className="border-t border-slate-100 px-3 py-2 space-y-1.5">
                    {r.description && <p className="text-xs text-slate-500 italic px-1 pb-1">{r.description}</p>}
                    {r.activites.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2 text-center">Aucune activité.</p>
                    ) : (
                      r.activites.map(a => (
                        <ActiviteRow key={a.id} activite={a} canEdit={canEdit}
                          niveau={0}
                          expanded={expanded} toggle={toggle}
                          onCreateChild={(parent) => openCreateActivite(r.id, parent.id, `${parent.code}.${(parent.enfants?.length ?? 0) + 1}`)}
                          onEdit={openEditActivite} onDelete={deleteActivite}
                          onRattacher={setRattachActivite} />
                      ))
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {/* ── Modal Résultat ───────────────────────────────────────── */}
      {resultatForm && (
        <Modal title={resultatForm.id ? 'Modifier le résultat' : 'Nouveau résultat attendu'} onClose={() => setResultatForm(null)}>
          <form onSubmit={saveResultat} className="space-y-3">
            <Field label="Code *">
              <input required value={resultatForm.code} onChange={e => setResultatForm({ ...resultatForm, code: e.target.value })}
                placeholder="R1, R2…" className="input font-mono" />
            </Field>
            <Field label="Libellé *">
              <input required value={resultatForm.libelle} onChange={e => setResultatForm({ ...resultatForm, libelle: e.target.value })}
                className="input" />
            </Field>
            <Field label="Description">
              <textarea rows={2} value={resultatForm.description} onChange={e => setResultatForm({ ...resultatForm, description: e.target.value })}
                className="input" />
            </Field>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
            <FooterButtons onCancel={() => setResultatForm(null)} submitLabel={resultatForm.id ? 'Enregistrer' : 'Créer'} />
          </form>
        </Modal>
      )}

      {/* ── Modal Rattacher tâches ────────────────────────────────── */}
      {rattachActivite && (
        <RattacherTachesModal
          projetId={projetId}
          activite={rattachActivite}
          onClose={() => setRattachActivite(null)}
          onSaved={() => { setRattachActivite(null); load(); }}
        />
      )}

      {/* ── Modal Activité ───────────────────────────────────────── */}
      {activiteForm && (
        <Modal title={activiteForm.id ? 'Modifier l\'activité' : (activiteForm.parentActiviteId ? 'Nouvelle sous-activité' : 'Nouvelle activité')} onClose={() => setActiviteForm(null)}>
          <form onSubmit={saveActivite} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Code *">
                <input required value={activiteForm.code} onChange={e => setActiviteForm({ ...activiteForm, code: e.target.value })}
                  placeholder="A1.1, A1.1.1…" className="input font-mono" />
              </Field>
              <Field label="Statut">
                <select value={activiteForm.statut} onChange={e => setActiviteForm({ ...activiteForm, statut: e.target.value })}
                  className="input">
                  {STATUTS_ACT.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Libellé *">
              <input required value={activiteForm.libelle} onChange={e => setActiviteForm({ ...activiteForm, libelle: e.target.value })}
                className="input" />
            </Field>
            <Field label="Description">
              <textarea rows={2} value={activiteForm.description} onChange={e => setActiviteForm({ ...activiteForm, description: e.target.value })}
                className="input" />
            </Field>
            <Field label="Responsable">
              <select value={activiteForm.responsableId} onChange={e => setActiviteForm({ ...activiteForm, responsableId: e.target.value })}
                className="input">
                <option value="">— Aucun —</option>
                {personnes.map(p => <option key={p.id} value={p.id}>{p.prenoms} {p.nom}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Début prévisionnel">
                <input type="date" value={activiteForm.dateDebutPrev} onChange={e => setActiviteForm({ ...activiteForm, dateDebutPrev: e.target.value })}
                  className="input" />
              </Field>
              <Field label="Fin prévisionnelle">
                <input type="date" value={activiteForm.dateFinPrev} onChange={e => setActiviteForm({ ...activiteForm, dateFinPrev: e.target.value })}
                  className="input" />
              </Field>
            </div>
            <Field label={`Progression : ${activiteForm.progression}%`}>
              <input type="range" min={0} max={100} value={activiteForm.progression}
                onChange={e => setActiviteForm({ ...activiteForm, progression: Number(e.target.value) })}
                className="w-full" />
            </Field>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
            <FooterButtons onCancel={() => setActiviteForm(null)} submitLabel={activiteForm.id ? 'Enregistrer' : 'Créer'} />
          </form>
        </Modal>
      )}

      <style jsx global>{`
        .input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid rgb(203 213 225); border-radius: 0.5rem; font-size: 0.875rem; }
        .input:focus { outline: 2px solid rgb(15 83 98 / 0.3); outline-offset: -2px; }
      `}</style>
    </div>
  );
}

// ── Composant : ligne activité (avec récursion sous-activités) ────────
function ActiviteRow({
  activite, niveau, canEdit, expanded, toggle, onCreateChild, onEdit, onDelete, onRattacher,
}: {
  activite: Activite;
  niveau: number;
  canEdit: boolean;
  expanded: Set<string>;
  toggle: (id: string) => void;
  onCreateChild: (parent: Activite) => void;
  onEdit: (a: Activite) => void;
  onDelete: (a: Activite) => void;
  onRattacher: (a: Activite) => void;
}) {
  const isOpen = expanded.has(activite.id);
  const hasChildren = (activite.enfants?.length ?? 0) > 0;
  const styleStatut = STATUT_ACT_STYLE[activite.statut] ?? 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <div>
      <div className="flex items-center gap-2 py-1.5 rounded-md hover:bg-slate-50 group"
           style={{ paddingLeft: `${niveau * 16 + 8}px` }}>
        <button onClick={() => toggle(activite.id)} className={`text-slate-400 hover:text-slate-700 shrink-0 ${!hasChildren ? 'invisible' : ''}`}>
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <ListChecks size={13} className="text-secondary shrink-0" />
        <span className="font-mono text-[11px] text-slate-500 shrink-0 w-16">{activite.code}</span>
        <span className="flex-1 text-sm text-slate-700 truncate">{activite.libelle}</span>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${styleStatut}`}>{activite.statut}</span>
        {activite.responsable && (
          <span className="text-xs text-slate-500 shrink-0 truncate max-w-[120px]">{activite.responsable.prenoms} {activite.responsable.nom[0]}.</span>
        )}
        <span className="text-xs text-slate-400 shrink-0 w-10 text-right">{activite.progression}%</span>
        {(activite._count?.taches ?? 0) > 0 && (
          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
            {activite._count?.taches} tâche(s)
          </span>
        )}
        {canEdit && (
          <div className="hidden group-hover:flex items-center gap-1 shrink-0">
            <button onClick={() => onRattacher(activite)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-primary" title="Rattacher des tâches">
              <Link2 size={12} />
            </button>
            <button onClick={() => onCreateChild(activite)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-primary" title="Sous-activité">
              <Plus size={12} />
            </button>
            <button onClick={() => onEdit(activite)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-primary" title="Modifier">
              <Pencil size={12} />
            </button>
            <button onClick={() => onDelete(activite)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500" title="Supprimer">
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
      {isOpen && hasChildren && (
        <div>
          {activite.enfants!.map(child => (
            <ActiviteRow key={child.id} activite={child} niveau={niveau + 1}
              canEdit={canEdit} expanded={expanded} toggle={toggle}
              onCreateChild={onCreateChild} onEdit={onEdit} onDelete={onDelete} onRattacher={onRattacher} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Composant : modale de rattachement de tâches à une activité ────────
function RattacherTachesModal({
  projetId, activite, onClose, onSaved,
}: {
  projetId: string;
  activite: Activite;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [taches, setTaches] = useState<Array<{ id: string; libelle: string; activiteId: string | null; statut: string }>>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`/api/projets/${projetId}`, { credentials: 'include' })
      .then(r => r.json())
      .then((p: { taches: Array<{ id: string; libelle: string; activiteId: string | null; statut: string }> }) => {
        setTaches(p.taches ?? []);
        const init = new Set<string>();
        (p.taches ?? []).forEach(t => { if (t.activiteId === activite.id) init.add(t.id); });
        setSelected(init);
      })
      .finally(() => setLoading(false));
  }, [projetId, activite.id]);

  function toggle(id: string) {
    setSelected(p => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  async function save() {
    setSaving(true);
    try {
      const ops: Promise<Response>[] = [];
      for (const t of taches) {
        const shouldBeAttached = selected.has(t.id);
        const isAttached = t.activiteId === activite.id;
        const isAttachedElsewhere = t.activiteId !== null && t.activiteId !== activite.id;
        if (shouldBeAttached && !isAttached) {
          ops.push(fetch(`/api/taches/${t.id}`, {
            method: 'PUT', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activiteId: activite.id }),
          }));
        } else if (!shouldBeAttached && isAttached) {
          ops.push(fetch(`/api/taches/${t.id}`, {
            method: 'PUT', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activiteId: '' }),
          }));
        }
        // Si attachée ailleurs et pas sélectionnée → on ne touche pas
        // Si attachée ailleurs et sélectionnée → on rattache ici (détachage implicite)
        if (isAttachedElsewhere && shouldBeAttached) {
          ops.push(fetch(`/api/taches/${t.id}`, {
            method: 'PUT', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activiteId: activite.id }),
          }));
        }
      }
      await Promise.all(ops);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const filtered = taches.filter(t => !search || t.libelle.toLowerCase().includes(search.toLowerCase()));
  const tachesLibres = filtered.filter(t => t.activiteId === null);
  const tachesActivite = filtered.filter(t => t.activiteId === activite.id);
  const tachesAilleurs = filtered.filter(t => t.activiteId !== null && t.activiteId !== activite.id);

  return (
    <Modal title={`Rattacher des tâches à "${activite.code} - ${activite.libelle}"`} onClose={onClose}>
      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-500">
          <Loader2 className="animate-spin mr-2" size={16} /> Chargement…
        </div>
      ) : (
        <div className="space-y-4">
          <input type="text" placeholder="Rechercher une tâche…" value={search} onChange={e => setSearch(e.target.value)}
            className="input" />

          <TacheGroup title={`Tâches déjà rattachées à cette activité (${tachesActivite.length})`} taches={tachesActivite} selected={selected} onToggle={toggle} />
          <TacheGroup title={`Tâches non rattachées (${tachesLibres.length})`} taches={tachesLibres} selected={selected} onToggle={toggle} />
          {tachesAilleurs.length > 0 && (
            <TacheGroup title={`Tâches rattachées à d'autres activités (${tachesAilleurs.length})`} taches={tachesAilleurs}
              selected={selected} onToggle={toggle} hint="Cocher une tâche la déplacera vers cette activité." />
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button onClick={save} disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-secondary rounded-lg disabled:opacity-50">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function TacheGroup({
  title, taches, selected, onToggle, hint,
}: {
  title: string;
  taches: Array<{ id: string; libelle: string; statut: string }>;
  selected: Set<string>;
  onToggle: (id: string) => void;
  hint?: string;
}) {
  if (taches.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 mb-1">{title}</p>
      {hint && <p className="text-[11px] text-amber-600 mb-1">{hint}</p>}
      <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-48 overflow-y-auto">
        {taches.map(t => (
          <label key={t.id} className="flex items-center gap-2 px-2.5 py-1.5 text-sm hover:bg-slate-50 cursor-pointer">
            <input type="checkbox" checked={selected.has(t.id)} onChange={() => onToggle(t.id)} className="rounded" />
            <span className="flex-1 truncate">{t.libelle}</span>
            <span className="text-[10px] text-slate-400">{t.statut}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Composants helpers ─────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
        <header className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h2 className="font-bold text-slate-800">{title}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X size={18} /></button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function FooterButtons({ onCancel, submitLabel }: { onCancel: () => void; submitLabel: string }) {
  return (
    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
      <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
      <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-secondary rounded-lg">{submitLabel}</button>
    </div>
  );
}
