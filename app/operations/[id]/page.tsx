'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Pause, Play, Archive, Plus, X, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Entite { id: string; libelle: string; typeEntite?: string | null }
interface Personne { id: string; nom: string; prenoms: string; entite: Entite }

interface TacheOp {
  id: string;
  libelle: string;
  description?: string | null;
  periodicite: string;
  configPeriodicite?: string | null;
  delaiExecution: number;
  priorite: string;
  estActif: boolean;
  dateDebut: string;
  dateFin?: string | null;
  responsable?: Personne | null;
  entite?: Entite | null;
  _count: { occurrences: number };
}

interface Occurrence {
  id: string;
  datePrevue: string;
  dateEcheance: string;
  dateRealisation?: string | null;
  statut: string;
  retardJours?: number | null;
  realisePar?: Personne | null;
  tacheOperationnelle: { id: string; libelle: string };
}

interface Operation {
  id: string;
  libelle: string;
  description?: string | null;
  statut: string;
  dateDebut: string;
  dateFin?: string | null;
  entite?: Entite | null;
  responsable?: Personne | null;
  projetSource?: { id: string; libelle: string } | null;
  taches: TacheOp[];
}

// ── Constantes ───────────────────────────────────────────────────────────────

const PERIODICITES = ['QUOTIDIENNE', 'HEBDOMADAIRE', 'MENSUELLE', 'TRIMESTRIELLE', 'SEMESTRIELLE', 'ANNUELLE', 'AD_HOC'];
const PERIODICITE_LABELS: Record<string, string> = {
  QUOTIDIENNE: 'Quotidienne', HEBDOMADAIRE: 'Hebdomadaire', MENSUELLE: 'Mensuelle',
  TRIMESTRIELLE: 'Trimestrielle', SEMESTRIELLE: 'Semestrielle', ANNUELLE: 'Annuelle', AD_HOC: 'Ad hoc',
};
const PRIORITES = ['Critique', 'Haute', 'Normale', 'Basse'];
const JOURS_SEMAINE = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];

const STATUT_OCC_STYLE: Record<string, React.CSSProperties> = {
  'En attente':          { background: '#dbeafe', color: '#1d4ed8' },
  'En cours':            { background: '#ffedd5', color: '#c2410c' },
  'Réalisée':            { background: '#dcfce7', color: '#15803d' },
  'En retard':           { background: '#fee2e2', color: '#b91c1c' },
  'Réalisée en retard':  { background: '#fef9c3', color: '#92400e' },
  'Annulée':             { background: '#f1f5f9', color: '#64748b' },
};

const PRIORITE_STYLE: Record<string, React.CSSProperties> = {
  Critique: { background: '#fee2e2', color: '#b91c1c' },
  Haute:    { background: '#ffedd5', color: '#c2410c' },
  Normale:  { background: '#dbeafe', color: '#1d4ed8' },
  Basse:    { background: '#f1f5f9', color: '#64748b' },
};

function fmtDate(d?: string | null) {
  return d ? new Date(d).toLocaleDateString('fr-FR') : '—';
}

// ── Config périodicité dynamique ─────────────────────────────────────────────

function ConfigPeriodicite({
  periodicite, config, onChange,
}: {
  periodicite: string;
  config: Record<string, unknown>;
  onChange: (cfg: Record<string, unknown>) => void;
}) {
  switch (periodicite) {
    case 'HEBDOMADAIRE':
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Jour de la semaine</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            value={String(config.jourDeLaSemaine ?? 'LUNDI')}
            onChange={e => onChange({ jourDeLaSemaine: e.target.value })}>
            {JOURS_SEMAINE.map(j => <option key={j}>{j}</option>)}
          </select>
        </div>
      );
    case 'MENSUELLE':
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Jour du mois (1–28)</label>
          <input type="number" min={1} max={28} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            value={Number(config.jourDuMois ?? 1)}
            onChange={e => onChange({ jourDuMois: Number(e.target.value) })} />
        </div>
      );
    case 'TRIMESTRIELLE':
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mois dans le trimestre</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={Number(config.moisDuTrimestre ?? 1)}
              onChange={e => onChange({ ...config, moisDuTrimestre: Number(e.target.value) })}>
              <option value={1}>1er mois</option><option value={2}>2e mois</option><option value={3}>3e mois</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Jour du mois (1–28)</label>
            <input type="number" min={1} max={28} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={Number(config.jourDuMois ?? 1)}
              onChange={e => onChange({ ...config, jourDuMois: Number(e.target.value) })} />
          </div>
        </div>
      );
    case 'SEMESTRIELLE':
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Jour du mois (1–28)</label>
          <input type="number" min={1} max={28} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            value={Number(config.jourDuMois ?? 1)}
            onChange={e => onChange({ jourDuMois: Number(e.target.value) })} />
        </div>
      );
    case 'ANNUELLE':
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mois (1–12)</label>
            <input type="number" min={1} max={12} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={Number(config.mois ?? 1)}
              onChange={e => onChange({ ...config, mois: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Jour (1–28)</label>
            <input type="number" min={1} max={28} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              value={Number(config.jour ?? 1)}
              onChange={e => onChange({ ...config, jour: Number(e.target.value) })} />
          </div>
        </div>
      );
    default:
      return null;
  }
}

// ── Composant tâche avec expansion ───────────────────────────────────────────

function LigneTache({
  tache, personnes, onUpdated, onDesactiver,
}: {
  tache: TacheOp;
  personnes: Personne[];
  entites?: Entite[];
  operationId?: string;
  onUpdated: (t: TacheOp) => void;
  onDesactiver: (id: string) => void;
}) {
  const [ouvert, setOuvert]     = useState(false);
  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState({ ...tache, configPeriodicite: tache.configPeriodicite ? JSON.parse(tache.configPeriodicite) : {} });
  const [saving, setSaving]     = useState(false);
  const [occurrences, setOccs]  = useState<Occurrence[]>([]);
  const [loadingOccs, setLoadingOccs] = useState(false);

  const toggleOuvrir = () => {
    if (!ouvert && !occurrences.length) {
      setLoadingOccs(true);
      fetch(`/api/taches-operationnelles/${tache.id}/occurrences`)
        .then(r => r.json()).then(d => setOccs(Array.isArray(d) ? d.slice(0, 10) : []))
        .finally(() => setLoadingOccs(false));
    }
    setOuvert(!ouvert);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/taches-operationnelles/${tache.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          libelle:           form.libelle,
          description:       form.description,
          periodicite:       form.periodicite,
          configPeriodicite: Object.keys(form.configPeriodicite).length ? form.configPeriodicite : null,
          delaiExecution:    form.delaiExecution,
          priorite:          form.priorite,
          responsableId:     form.responsable?.id || null,
          entiteId:          form.entite?.id      || null,
          dateDebut:         form.dateDebut,
          dateFin:           form.dateFin || null,
        }),
      });
      if (res.ok) { onUpdated(await res.json()); setEditing(false); }
    } finally { setSaving(false); }
  };

  return (
    <div className={`border rounded-xl mb-2 ${tache.estActif ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
      {/* Ligne principale */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={toggleOuvrir} className="text-slate-400">
          {ouvert ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-800">{tache.libelle}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{PERIODICITE_LABELS[tache.periodicite]}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={PRIORITE_STYLE[tache.priorite]}>{tache.priorite}</span>
            {!tache.estActif && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">Inactif</span>}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {tache.responsable ? `${tache.responsable.nom} ${tache.responsable.prenoms}` : 'Sans responsable'}
            {' · '}Délai : {tache.delaiExecution}j
            {' · '}{tache._count.occurrences} occurrence{tache._count.occurrences > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setEditing(!editing)} className="text-slate-400 hover:text-primary p-1"><Pencil size={14} /></button>
          {tache.estActif && (
            <button onClick={() => onDesactiver(tache.id)} className="text-slate-400 hover:text-red-500 p-1 text-xs">Désactiver</button>
          )}
        </div>
      </div>

      {/* Formulaire édition */}
      {editing && (
        <div className="border-t border-slate-100 px-4 py-4 bg-slate-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Libellé</label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Périodicité</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={form.periodicite}
                onChange={e => setForm({ ...form, periodicite: e.target.value, configPeriodicite: {} })}>
                {PERIODICITES.map(p => <option key={p} value={p}>{PERIODICITE_LABELS[p]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Délai d'exécution (jours)</label>
              <input type="number" min={1} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={form.delaiExecution} onChange={e => setForm({ ...form, delaiExecution: Number(e.target.value) })} />
            </div>
            <div className="col-span-2">
              <ConfigPeriodicite periodicite={form.periodicite} config={form.configPeriodicite as Record<string, unknown>}
                onChange={cfg => setForm({ ...form, configPeriodicite: cfg })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Priorité</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={form.priorite} onChange={e => setForm({ ...form, priorite: e.target.value })}>
                {PRIORITES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Responsable</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={form.responsable?.id ?? ''}
                onChange={e => setForm({ ...form, responsable: personnes.find(p => p.id === e.target.value) || null })}>
                <option value="">— Aucun —</option>
                {personnes.map(p => <option key={p.id} value={p.id}>{p.nom} {p.prenoms}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button onClick={() => setEditing(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">Annuler</button>
          </div>
        </div>
      )}

      {/* Occurrences récentes */}
      {ouvert && (
        <div className="border-t border-slate-100 px-4 py-3">
          <p className="text-xs font-semibold text-slate-500 mb-2">10 dernières occurrences</p>
          {loadingOccs ? <p className="text-xs text-slate-400">Chargement…</p> : occurrences.length === 0 ? (
            <p className="text-xs text-slate-400">Aucune occurrence générée.</p>
          ) : (
            <div className="space-y-1">
              {occurrences.map(o => (
                <div key={o.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                  <span className="text-slate-600">{fmtDate(o.datePrevue)} → {fmtDate(o.dateEcheance)}</span>
                  <div className="flex items-center gap-2">
                    {o.retardJours != null && o.retardJours > 0 && (
                      <span className="text-red-500">+{o.retardJours}j</span>
                    )}
                    <span className="px-2 py-0.5 rounded-full font-semibold" style={STATUT_OCC_STYLE[o.statut]}>{o.statut}</span>
                    <Link href={`/occurrences/${o.id}`} className="text-slate-400 hover:text-primary"><ExternalLink size={12} /></Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

const EMPTY_TACHE_FORM = {
  libelle: '', description: '', periodicite: 'MENSUELLE', configPeriodicite: {} as Record<string, unknown>,
  delaiExecution: 3, priorite: 'Normale', responsableId: '', entiteId: '', dateDebut: '', dateFin: '',
};

export default function OperationDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const id       = String(params.id);

  const [operation, setOperation] = useState<Operation | null>(null);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [personnes, setPersonnes]   = useState<Personne[]>([]);
  const [entites, setEntites]       = useState<Entite[]>([]);
  const [onglet, setOnglet]         = useState<'taches' | 'occurrences'>('taches');
  const [loading, setLoading]       = useState(true);
  const [showTacheForm, setShowTacheForm] = useState(false);
  const [tacheForm, setTacheForm]   = useState(EMPTY_TACHE_FORM);
  const [tacheError, setTacheError] = useState('');
  const [showEditOp, setShowEditOp] = useState(false);
  const [editForm, setEditForm]     = useState({ libelle: '', description: '', statut: '', entiteId: '', responsableId: '', dateDebut: '', dateFin: '' });

  useEffect(() => {
    Promise.all([
      fetch(`/api/operations/${id}`).then(r => r.json()),
      fetch(`/api/occurrences?operationId=${id}`).then(r => r.json()),
      fetch('/api/personnes').then(r => r.json()),
      fetch('/api/entites').then(r => r.json()),
    ]).then(([op, occs, pers, ents]) => {
      if (op?.id) {
        setOperation(op);
        setEditForm({
          libelle: op.libelle, description: op.description ?? '',
          statut: op.statut, entiteId: op.entite?.id ?? '',
          responsableId: op.responsable?.id ?? '',
          dateDebut: op.dateDebut?.slice(0, 10) ?? '',
          dateFin: op.dateFin?.slice(0, 10) ?? '',
        });
      }
      setOccurrences(Array.isArray(occs) ? occs : []);
      setPersonnes(Array.isArray(pers) ? pers : []);
      setEntites(Array.isArray(ents) ? ents : []);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleToggleStatut = async () => {
    if (!operation) return;
    const newStatut = operation.statut === 'Active' ? 'Suspendue' : 'Active';
    const res = await fetch(`/api/operations/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: newStatut }),
    });
    if (res.ok) setOperation({ ...operation, statut: newStatut });
  };

  const handleArchiver = async () => {
    if (!confirm('Archiver cette opération ?')) return;
    const res = await fetch(`/api/operations/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/operations');
  };

  const handleSaveOp = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/operations/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        libelle:       editForm.libelle,
        description:   editForm.description || null,
        statut:        editForm.statut,
        entiteId:      editForm.entiteId       || null,
        responsableId: editForm.responsableId  || null,
        dateDebut:     editForm.dateDebut,
        dateFin:       editForm.dateFin        || null,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOperation(updated);
      setShowEditOp(false);
    }
  };

  const handleAjouterTache = async (e: React.FormEvent) => {
    e.preventDefault();
    setTacheError('');
    const res = await fetch(`/api/operations/${id}/taches`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        libelle:           tacheForm.libelle,
        description:       tacheForm.description || null,
        periodicite:       tacheForm.periodicite,
        configPeriodicite: Object.keys(tacheForm.configPeriodicite).length ? tacheForm.configPeriodicite : null,
        delaiExecution:    tacheForm.delaiExecution,
        priorite:          tacheForm.priorite,
        responsableId:     tacheForm.responsableId || null,
        entiteId:          tacheForm.entiteId      || null,
        dateDebut:         tacheForm.dateDebut,
        dateFin:           tacheForm.dateFin       || null,
      }),
    });
    if (!res.ok) { const d = await res.json(); setTacheError(d?.error || 'Erreur.'); return; }
    const newT = await res.json();
    setOperation(prev => prev ? { ...prev, taches: [...prev.taches, newT] } : prev);
    setTacheForm(EMPTY_TACHE_FORM);
    setShowTacheForm(false);
  };

  const handleTacheUpdated = (updated: TacheOp) => {
    setOperation(prev => prev ? { ...prev, taches: prev.taches.map(t => t.id === updated.id ? updated : t) } : prev);
  };

  const handleDesactiver = async (tacheId: string) => {
    if (!confirm('Désactiver cette tâche ?')) return;
    const res = await fetch(`/api/taches-operationnelles/${tacheId}`, { method: 'DELETE' });
    if (res.ok) {
      setOperation(prev => prev ? { ...prev, taches: prev.taches.map(t => t.id === tacheId ? { ...t, estActif: false } : t) } : prev);
    }
  };

  if (loading) return <p className="text-gray-500">Chargement…</p>;
  if (!operation) return <div className="text-center py-20 text-slate-400">Opération introuvable. <Link href="/operations" className="text-primary underline">Retour</Link></div>;

  const nbRetard   = occurrences.filter(o => o.statut === 'En retard').length;
  const prochaine  = occurrences.filter(o => o.statut === 'En attente').sort((a, b) => new Date(a.datePrevue).getTime() - new Date(b.datePrevue).getTime())[0];
  const nbRealisees = occurrences.filter(o => o.statut === 'Réalisée' || o.statut === 'Réalisée en retard').length;
  const nbCloturees = occurrences.filter(o => ['Réalisée', 'Réalisée en retard', 'Annulée'].includes(o.statut)).length;
  const tauxExec   = nbCloturees > 0 ? Math.round(nbRealisees / nbCloturees * 100) : null;

  return (
    <div className="space-y-6">
      {/* Retour */}
      <Link href="/operations" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary">
        <ArrowLeft size={16} /> Toutes les opérations
      </Link>

      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-bold text-primary">{operation.libelle}</h1>
              {statutBadge(operation.statut)}
            </div>
            {operation.description && <p className="text-slate-500 text-sm mt-1">{operation.description}</p>}
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
              {operation.entite && (
                <span><span className="font-medium">Entité :</span> {operation.entite.typeEntite ? `[${operation.entite.typeEntite}] ` : ''}{operation.entite.libelle}</span>
              )}
              {operation.responsable && (
                <span><span className="font-medium">Responsable :</span> {operation.responsable.nom} {operation.responsable.prenoms}</span>
              )}
              {operation.projetSource && (
                <span><span className="font-medium">Projet source :</span>{' '}
                  <Link href={`/projets/${operation.projetSource.id}`} className="text-primary hover:underline inline-flex items-center gap-1">
                    {operation.projetSource.libelle} <ExternalLink size={12} />
                  </Link>
                </span>
              )}
              <span><span className="font-medium">Début :</span> {fmtDate(operation.dateDebut)}</span>
              {operation.dateFin && <span><span className="font-medium">Fin :</span> {fmtDate(operation.dateFin)}</span>}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setShowEditOp(!showEditOp)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
              <Pencil size={14} /> Modifier
            </button>
            {operation.statut !== 'Archivée' && (
              <button onClick={handleToggleStatut} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
                {operation.statut === 'Active' ? <><Pause size={14} /> Suspendre</> : <><Play size={14} /> Réactiver</>}
              </button>
            )}
            {operation.statut !== 'Archivée' && (
              <button onClick={handleArchiver} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-sm text-red-500 hover:bg-red-50">
                <Archive size={14} /> Archiver
              </button>
            )}
          </div>
        </div>

        {/* Formulaire édition inline */}
        {showEditOp && (
          <form onSubmit={handleSaveOp} className="mt-4 border-t pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Libellé</label>
                <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={editForm.libelle} onChange={e => setEditForm({ ...editForm, libelle: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Entité</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={editForm.entiteId} onChange={e => setEditForm({ ...editForm, entiteId: e.target.value })}>
                  <option value="">— Aucune —</option>
                  {entites.map(e => <option key={e.id} value={e.id}>{e.libelle}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Responsable</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={editForm.responsableId} onChange={e => setEditForm({ ...editForm, responsableId: e.target.value })}>
                  <option value="">— Aucun —</option>
                  {personnes.map(p => <option key={p.id} value={p.id}>{p.nom} {p.prenoms}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={editForm.statut} onChange={e => setEditForm({ ...editForm, statut: e.target.value })}>
                  <option>Active</option><option>Suspendue</option><option>Archivée</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date de début</label>
                <input type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={editForm.dateDebut} onChange={e => setEditForm({ ...editForm, dateDebut: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold">Enregistrer</button>
              <button type="button" onClick={() => setShowEditOp(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">Annuler</button>
            </div>
          </form>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: '#0f5362' }}>{tauxExec !== null ? `${tauxExec}%` : '—'}</p>
          <p className="text-xs text-slate-500 mt-1">Taux d'exécution</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{nbRetard}</p>
          <p className="text-xs text-slate-500 mt-1">En retard</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{prochaine ? fmtDate(prochaine.datePrevue) : '—'}</p>
          <p className="text-xs text-slate-500 mt-1">Prochaine occurrence</p>
        </div>
      </div>

      {/* Onglets */}
      <div>
        <div className="flex border-b border-slate-200 mb-4">
          {(['taches', 'occurrences'] as const).map(tab => (
            <button key={tab} onClick={() => setOnglet(tab)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${onglet === tab ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {tab === 'taches' ? `Tâches récurrentes (${operation.taches.length})` : `Occurrences (${occurrences.length})`}
            </button>
          ))}
        </div>

        {/* Onglet Tâches */}
        {onglet === 'taches' && (
          <div>
            <div className="flex justify-end mb-3">
              <button onClick={() => setShowTacheForm(!showTacheForm)}
                className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                <Plus size={14} /> Ajouter une tâche
              </button>
            </div>

            {/* Formulaire nouvelle tâche */}
            {showTacheForm && (
              <form onSubmit={handleAjouterTache} className="bg-white border border-slate-200 rounded-xl p-5 mb-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-primary">Nouvelle tâche récurrente</h3>
                  <button type="button" onClick={() => setShowTacheForm(false)}><X size={16} className="text-slate-400" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Libellé *</label>
                    <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={tacheForm.libelle} onChange={e => setTacheForm({ ...tacheForm, libelle: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <textarea rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={tacheForm.description} onChange={e => setTacheForm({ ...tacheForm, description: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Périodicité *</label>
                    <select required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={tacheForm.periodicite}
                      onChange={e => setTacheForm({ ...tacheForm, periodicite: e.target.value, configPeriodicite: {} })}>
                      {PERIODICITES.map(p => <option key={p} value={p}>{PERIODICITE_LABELS[p]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Délai d'exécution (jours)</label>
                    <input type="number" min={1} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={tacheForm.delaiExecution} onChange={e => setTacheForm({ ...tacheForm, delaiExecution: Number(e.target.value) })} />
                  </div>
                  <div className="col-span-2">
                    <ConfigPeriodicite periodicite={tacheForm.periodicite} config={tacheForm.configPeriodicite}
                      onChange={cfg => setTacheForm({ ...tacheForm, configPeriodicite: cfg })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Priorité</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={tacheForm.priorite} onChange={e => setTacheForm({ ...tacheForm, priorite: e.target.value })}>
                      {PRIORITES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Responsable</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={tacheForm.responsableId} onChange={e => setTacheForm({ ...tacheForm, responsableId: e.target.value })}>
                      <option value="">— Aucun —</option>
                      {personnes.map(p => <option key={p.id} value={p.id}>{p.nom} {p.prenoms}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date de début *</label>
                    <input required type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={tacheForm.dateDebut} onChange={e => setTacheForm({ ...tacheForm, dateDebut: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date de fin</label>
                    <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={tacheForm.dateFin} onChange={e => setTacheForm({ ...tacheForm, dateFin: e.target.value })} />
                  </div>
                </div>
                {tacheError && <p className="text-sm text-red-600">{tacheError}</p>}
                <div className="flex gap-2">
                  <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold">Ajouter</button>
                  <button type="button" onClick={() => setShowTacheForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">Annuler</button>
                </div>
              </form>
            )}

            {operation.taches.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">Aucune tâche récurrente. Ajoutez-en une.</p>
            ) : (
              <div>
                {operation.taches.map(t => (
                  <LigneTache key={t.id} tache={t} personnes={personnes} entites={entites}
                    operationId={id} onUpdated={handleTacheUpdated} onDesactiver={handleDesactiver} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Onglet Occurrences */}
        {onglet === 'occurrences' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {occurrences.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">Aucune occurrence.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Tâche</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Date prévue</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Échéance</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Statut</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Réalisé par</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600">Retard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {occurrences.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <Link href={`/occurrences/${o.id}`} className="text-primary hover:underline text-xs">{o.tacheOperationnelle.libelle}</Link>
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-600">{fmtDate(o.datePrevue)}</td>
                      <td className="px-4 py-2 text-xs text-slate-600">{fmtDate(o.dateEcheance)}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={STATUT_OCC_STYLE[o.statut]}>{o.statut}</span>
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-500">
                        {o.realisePar ? `${o.realisePar.nom} ${o.realisePar.prenoms}` : '—'}
                      </td>
                      <td className="px-4 py-2 text-right text-xs">
                        {o.retardJours != null && o.retardJours > 0
                          ? <span className="text-red-500 font-semibold">+{o.retardJours}j</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function statutBadge(statut: string) {
  const styles: Record<string, React.CSSProperties> = {
    'Active':    { background: '#dcfce7', color: '#15803d' },
    'Suspendue': { background: '#fef9c3', color: '#92400e' },
    'Archivée':  { background: '#f1f5f9', color: '#64748b' },
  };
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={styles[statut] ?? styles['Active']}>
      {statut}
    </span>
  );
}
