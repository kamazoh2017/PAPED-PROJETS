'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, X, AlertCircle, Clock, Zap } from 'lucide-react';

interface Entite {
  id: string;
  libelle: string;
  typeEntite?: string | null;
}

interface Personne {
  id: string;
  nom: string;
  prenoms: string;
  fonction: string;
  entite: Entite;
}

interface Operation {
  id: string;
  libelle: string;
  description?: string | null;
  statut: string;
  dateDebut: string;
  dateFin?: string | null;
  entite?: Entite | null;
  responsable?: { id: string; nom: string; prenoms: string; entite: Entite } | null;
  projetSource?: { id: string; libelle: string } | null;
  _count: { taches: number };
}

interface Indicateurs {
  actives: number;
  retard: number;
  semaine: number;
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

const EMPTY_FORM = {
  libelle: '', description: '', statut: 'Active',
  entiteId: '', responsableId: '', projetSourceId: '',
  dateDebut: '', dateFin: '',
};

export default function OperationsPage() {
  const [operations, setOperations]     = useState<Operation[]>([]);
  const [entites, setEntites]           = useState<Entite[]>([]);
  const [personnes, setPersonnes]       = useState<Personne[]>([]);
  const [indicateurs, setIndicateurs]   = useState<Indicateurs>({ actives: 0, retard: 0, semaine: 0 });
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [formData, setFormData]         = useState(EMPTY_FORM);
  const [formError, setFormError]       = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtreEntite, setFiltreEntite] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/operations').then(r => r.json()),
      fetch('/api/entites').then(r => r.json()),
      fetch('/api/personnes').then(r => r.json()),
      fetch('/api/occurrences?statut=En retard').then(r => r.json()),
    ]).then(([ops, ents, pers, retards]) => {
      const opsList: Operation[] = Array.isArray(ops) ? ops : [];
      setOperations(opsList);
      setEntites(Array.isArray(ents) ? ents : []);
      setPersonnes(Array.isArray(pers) ? pers : []);

      const now   = new Date();
      const fin7  = new Date(now); fin7.setDate(now.getDate() + 7);
      const retardCount = Array.isArray(retards) ? retards.length : 0;

      fetch('/api/occurrences?statut=En attente').then(r => r.json()).then((enAttente: any[]) => {
        const semaine = Array.isArray(enAttente)
          ? enAttente.filter(o => new Date(o.dateEcheance) <= fin7).length
          : 0;
        setIndicateurs({
          actives: opsList.filter(o => o.statut === 'Active').length,
          retard: retardCount,
          semaine,
        });
      });
    }).finally(() => setLoading(false));
  }, []);

  const opsFiltrees = operations.filter(op => {
    if (filtreStatut && op.statut !== filtreStatut) return false;
    if (filtreEntite && op.entite?.id !== filtreEntite) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formData.entiteId && !formData.responsableId) {
      setFormError('Une entité ou un responsable est obligatoire.');
      return;
    }
    try {
      const res = await fetch('/api/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          libelle:        formData.libelle,
          description:    formData.description || null,
          statut:         formData.statut,
          entiteId:       formData.entiteId       || null,
          responsableId:  formData.responsableId  || null,
          projetSourceId: formData.projetSourceId || null,
          dateDebut:      formData.dateDebut,
          dateFin:        formData.dateFin        || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data?.error || 'Erreur lors de la création.');
        return;
      }
      const newOp = await res.json();
      setOperations(prev => [newOp, ...prev]);
      setFormData(EMPTY_FORM);
      setShowForm(false);
      setIndicateurs(prev => ({ ...prev, actives: newOp.statut === 'Active' ? prev.actives + 1 : prev.actives }));
    } catch {
      setFormError('Erreur réseau.');
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-primary">Opérations</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white px-5 py-2 rounded-lg font-semibold"
        >
          <Plus size={16} /> Nouvelle opération
        </button>
      </div>

      {/* Indicateurs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 rounded-full bg-green-100">
            <Zap size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{indicateurs.actives}</p>
            <p className="text-sm text-slate-500">Opérations actives</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 rounded-full bg-red-100">
            <AlertCircle size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{indicateurs.retard}</p>
            <p className="text-sm text-slate-500">Occurrences en retard</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 rounded-full bg-blue-100">
            <Clock size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{indicateurs.semaine}</p>
            <p className="text-sm text-slate-500">À faire cette semaine</p>
          </div>
        </div>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-xl p-6 space-y-4 border border-slate-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-primary">Nouvelle opération</h2>
            <button type="button" onClick={() => setShowForm(false)}><X size={18} className="text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Libellé *</label>
              <input required value={formData.libelle} onChange={e => setFormData({ ...formData, libelle: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Nom de l'opération" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Entité responsable</label>
              <select value={formData.entiteId} onChange={e => setFormData({ ...formData, entiteId: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">— Aucune —</option>
                {entites.map(e => <option key={e.id} value={e.id}>{e.typeEntite ? `[${e.typeEntite}] ` : ''}{e.libelle}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Responsable direct</label>
              <select value={formData.responsableId} onChange={e => setFormData({ ...formData, responsableId: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">— Aucun —</option>
                {personnes.map(p => <option key={p.id} value={p.id}>{p.nom} {p.prenoms} — {p.entite?.libelle}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date de début *</label>
              <input required type="date" value={formData.dateDebut} onChange={e => setFormData({ ...formData, dateDebut: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date de fin <span className="text-slate-400">(vide = permanente)</span></label>
              <input type="date" value={formData.dateFin} onChange={e => setFormData({ ...formData, dateFin: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-3">
            <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg font-semibold">Créer</button>
            <button type="button" onClick={() => { setShowForm(false); setFormError(''); }} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-lg">Annuler</button>
          </div>
        </form>
      )}

      {/* Filtres */}
      <div className="flex gap-3">
        <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">Tous les statuts</option>
          <option>Active</option><option>Suspendue</option><option>Archivée</option>
        </select>
        <select value={filtreEntite} onChange={e => setFiltreEntite(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">Toutes les entités</option>
          {entites.map(e => <option key={e.id} value={e.id}>{e.libelle}</option>)}
        </select>
        {(filtreStatut || filtreEntite) && (
          <button onClick={() => { setFiltreStatut(''); setFiltreEntite(''); }}
            className="px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-700 border border-slate-200 bg-white">
            Réinitialiser
          </button>
        )}
      </div>

      {/* Tableau */}
      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : opsFiltrees.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          {operations.length === 0 ? 'Aucune opération. Créez la première.' : 'Aucune opération ne correspond aux filtres.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Opération</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Entité</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Responsable</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Statut</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Tâches</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Début</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {opsFiltrees.map(op => (
                <tr key={op.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3">
                    <Link href={`/operations/${op.id}`} className="font-medium text-primary hover:underline">
                      {op.libelle}
                    </Link>
                    {op.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{op.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {op.entite ? (
                      <span>{op.entite.typeEntite ? <span className="text-xs text-slate-400 mr-1">[{op.entite.typeEntite}]</span> : null}{op.entite.libelle}</span>
                    ) : <span className="text-slate-400 italic text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {op.responsable
                      ? `${op.responsable.nom} ${op.responsable.prenoms}`
                      : <span className="text-slate-400 italic text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">{statutBadge(op.statut)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block bg-slate-100 text-slate-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                      {op._count.taches}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(op.dateDebut).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
