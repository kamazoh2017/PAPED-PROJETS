'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Play, XCircle, Send } from 'lucide-react';
import HistoriqueDrawer from '@/components/HistoriqueDrawer';

interface Entite { id: string; libelle: string }
interface Personne { id: string; nom: string; prenoms: string; entite: Entite }

interface Commentaire {
  id: string;
  contenu: string;
  dateCreation: string;
  compteAcces: { id: string; login: string | null; personne?: { nom: string; prenoms: string } | null };
  reponses: Commentaire[];
}

interface Occurrence {
  id: string;
  datePrevue: string;
  dateEcheance: string;
  dateRealisation?: string | null;
  statut: string;
  commentaire?: string | null;
  retardJours?: number | null;
  realisePar?: Personne | null;
  commentaires: Commentaire[];
  tacheOperationnelle: {
    id: string;
    libelle: string;
    description?: string | null;
    periodicite: string;
    priorite: string;
    delaiExecution: number;
    responsable?: Personne | null;
    operation: {
      id: string;
      libelle: string;
      statut: string;
      entite?: Entite | null;
      responsable?: Personne | null;
    };
  };
}

const STATUT_STYLE: Record<string, React.CSSProperties> = {
  'En attente':          { background: '#dbeafe', color: '#1d4ed8' },
  'En cours':            { background: '#ffedd5', color: '#c2410c' },
  'Réalisée':            { background: '#dcfce7', color: '#15803d' },
  'En retard':           { background: '#fee2e2', color: '#b91c1c' },
  'Réalisée en retard':  { background: '#fef9c3', color: '#92400e' },
  'Annulée':             { background: '#f1f5f9', color: '#64748b' },
};

const PERIODICITE_LABEL: Record<string, string> = {
  QUOTIDIENNE: 'Quotidienne', HEBDOMADAIRE: 'Hebdomadaire', MENSUELLE: 'Mensuelle',
  TRIMESTRIELLE: 'Trimestrielle', SEMESTRIELLE: 'Semestrielle', ANNUELLE: 'Annuelle', AD_HOC: 'Ad hoc',
};

function fmtDate(d?: string | null) {
  return d ? new Date(d).toLocaleDateString('fr-FR') : '—';
}
function fmtDateHeure(d?: string | null) {
  return d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
}

function CommentaireItem({ c, niveau = 0 }: { c: Commentaire; niveau?: number }) {
  const auteur = c.compteAcces.personne
    ? `${c.compteAcces.personne.nom} ${c.compteAcces.personne.prenoms}`
    : c.compteAcces.login ?? 'Utilisateur';
  return (
    <div className={`${niveau > 0 ? 'ml-8 border-l-2 border-slate-100 pl-4' : ''}`}>
      <div className="bg-white border border-slate-200 rounded-xl p-3 mb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-slate-700">{auteur}</span>
          <span className="text-xs text-slate-400">{fmtDateHeure(c.dateCreation)}</span>
        </div>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.contenu}</p>
      </div>
      {c.reponses?.map(r => <CommentaireItem key={r.id} c={r} niveau={niveau + 1} />)}
    </div>
  );
}

export default function OccurrenceDetailPage() {
  const params = useParams();
  const id     = String(params.id);

  const [occurrence, setOccurrence] = useState<Occurrence | null>(null);
  const [personnes, setPersonnes]   = useState<{ id: string; nom: string; prenoms: string }[]>([]);
  const [loading, setLoading]       = useState(true);

  // Action états
  const [showPriseEnCharge, setShowPriseEnCharge] = useState(false);
  const [showCloture, setShowCloture]             = useState(false);
  const [showAnnulation, setShowAnnulation]       = useState(false);
  const [realiseParId, setRealiseParId]           = useState('');
  const [dateRealisation, setDateRealisation]     = useState('');
  const [motifAnnulation, setMotifAnnulation]     = useState('');
  const [commentaireTexte, setCommentaireTexte]   = useState('');
  const [commentaireCloture, setCommentaireCloture] = useState('');
  const [saving, setSaving]                       = useState(false);
  const [repondreA, setRepondreA]                 = useState<string | null>(null);
  const [reponseTexte, setReponseTexte]           = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/occurrences/${id}`).then(r => r.json()),
      fetch('/api/personnes').then(r => r.json()),
    ]).then(([occ, pers]) => {
      if (occ?.id) setOccurrence(occ);
      setPersonnes(Array.isArray(pers) ? pers : []);
    }).finally(() => setLoading(false));
  }, [id]);

  const patchStatut = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/occurrences/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) setOccurrence(await res.json());
    } finally { setSaving(false); }
  };

  const handlePriseEnCharge = async () => {
    await patchStatut({ statut: 'En cours', realiseParId: realiseParId || null });
    setShowPriseEnCharge(false);
  };

  const handleCloture = async () => {
    await patchStatut({
      statut: 'Réalisée',
      realiseParId: realiseParId || null,
      dateRealisation: dateRealisation || null,
      commentaire: commentaireCloture || null,
    });
    setShowCloture(false);
  };

  const handleAnnulation = async () => {
    if (!motifAnnulation.trim()) return;
    await patchStatut({ statut: 'Annulée', commentaire: motifAnnulation });
    setShowAnnulation(false);
  };

  const handleCommentaire = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    const texte = parentId ? reponseTexte : commentaireTexte;
    if (!texte.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/occurrences/${id}/commentaires`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu: texte, parentId: parentId ?? null }),
      });
      if (res.ok) {
        // Recharger occurrence pour avoir les commentaires à jour
        const updated = await fetch(`/api/occurrences/${id}`).then(r => r.json());
        setOccurrence(updated);
        if (parentId) { setRepondreA(null); setReponseTexte(''); }
        else setCommentaireTexte('');
      }
    } finally { setSaving(false); }
  };

  if (loading) return <p className="text-slate-400 p-8">Chargement…</p>;
  if (!occurrence) return (
    <div className="text-center py-20 text-slate-400">
      Occurrence introuvable. <Link href="/occurrences" className="text-primary underline">Retour</Link>
    </div>
  );

  const { tacheOperationnelle: tache, statut } = occurrence;
  const peutPrendreEnCharge = statut === 'En attente';
  const peutCloturer        = statut === 'En cours' || statut === 'En retard';
  const peutAnnuler         = !['Réalisée', 'Réalisée en retard', 'Annulée'].includes(statut);

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/occurrences" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary">
        <ArrowLeft size={16} /> Toutes les occurrences
      </Link>

      {/* En-tête */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-primary">{tache.libelle}</h1>
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-500">
              <Link href={`/operations/${tache.operation.id}`} className="hover:text-primary hover:underline">
                {tache.operation.libelle}
              </Link>
              {tache.operation.entite && <span>· {tache.operation.entite.libelle}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <HistoriqueDrawer table="OccurrenceTache" id={occurrence.id} titre={tache.libelle} />
            <span className="px-3 py-1 rounded-full text-sm font-semibold" style={STATUT_STYLE[statut]}>
              {statut}
            </span>
          </div>
        </div>

        {/* Détails */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Date prévue</p>
            <p className="font-semibold text-slate-700">{fmtDate(occurrence.datePrevue)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Échéance</p>
            <p className="font-semibold text-slate-700">{fmtDate(occurrence.dateEcheance)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Périodicité</p>
            <p className="font-semibold text-slate-700">{PERIODICITE_LABEL[tache.periodicite] ?? tache.periodicite}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Priorité</p>
            <p className="font-semibold text-slate-700">{tache.priorite}</p>
          </div>
        </div>

        {occurrence.dateRealisation && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-2">
            <CheckCircle2 size={16} />
            Réalisée le {fmtDate(occurrence.dateRealisation)}
            {occurrence.realisePar && ` par ${occurrence.realisePar.nom} ${occurrence.realisePar.prenoms}`}
            {occurrence.retardJours != null && occurrence.retardJours > 0 && (
              <span className="ml-2 text-amber-600 font-semibold">+{occurrence.retardJours}j de retard</span>
            )}
          </div>
        )}

        {occurrence.commentaire && (
          <div className="text-sm text-slate-600 bg-slate-50 rounded-lg px-4 py-2 italic">
            {occurrence.commentaire}
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
          {peutPrendreEnCharge && (
            <button onClick={() => setShowPriseEnCharge(!showPriseEnCharge)}
              className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-secondary/90">
              <Play size={14} /> Prendre en charge
            </button>
          )}
          {peutCloturer && (
            <button onClick={() => setShowCloture(!showCloture)}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90">
              <CheckCircle2 size={14} /> Marquer réalisée
            </button>
          )}
          {peutAnnuler && (
            <button onClick={() => setShowAnnulation(!showAnnulation)}
              className="flex items-center gap-2 border border-red-200 text-red-500 px-4 py-2 rounded-lg text-sm hover:bg-red-50">
              <XCircle size={14} /> Annuler
            </button>
          )}
        </div>

        {/* Panel prise en charge */}
        {showPriseEnCharge && (
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
            <h3 className="font-semibold text-sm text-slate-700">Prise en charge</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Réalisé par</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={realiseParId} onChange={e => setRealiseParId(e.target.value)}>
                <option value="">— Responsable par défaut —</option>
                {personnes.map(p => <option key={p.id} value={p.id}>{p.nom} {p.prenoms}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handlePriseEnCharge} disabled={saving}
                className="bg-secondary text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                {saving ? 'En cours…' : 'Confirmer'}
              </button>
              <button onClick={() => setShowPriseEnCharge(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">Annuler</button>
            </div>
          </div>
        )}

        {/* Panel clôture */}
        {showCloture && (
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
            <h3 className="font-semibold text-sm text-slate-700">Marquer comme réalisée</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date de réalisation</label>
                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={dateRealisation} onChange={e => setDateRealisation(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Réalisé par</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={realiseParId} onChange={e => setRealiseParId(e.target.value)}>
                  <option value="">— Par défaut —</option>
                  {personnes.map(p => <option key={p.id} value={p.id}>{p.nom} {p.prenoms}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Commentaire de clôture</label>
                <textarea rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={commentaireCloture} onChange={e => setCommentaireCloture(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCloture} disabled={saving}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                {saving ? 'Enregistrement…' : 'Confirmer'}
              </button>
              <button onClick={() => setShowCloture(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">Annuler</button>
            </div>
          </div>
        )}

        {/* Panel annulation */}
        {showAnnulation && (
          <div className="border border-red-200 rounded-xl p-4 space-y-3 bg-red-50">
            <h3 className="font-semibold text-sm text-red-700">Annuler l'occurrence</h3>
            <div>
              <label className="block text-xs font-medium text-red-600 mb-1">Motif d'annulation *</label>
              <textarea required rows={2} className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm"
                value={motifAnnulation} onChange={e => setMotifAnnulation(e.target.value)}
                placeholder="Expliquez pourquoi cette occurrence est annulée…" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAnnulation} disabled={saving || !motifAnnulation.trim()}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                {saving ? 'Annulation…' : 'Confirmer l\'annulation'}
              </button>
              <button onClick={() => setShowAnnulation(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">Retour</button>
            </div>
          </div>
        )}
      </div>

      {/* Commentaires */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-700">Commentaires ({occurrence.commentaires.length})</h2>

        {occurrence.commentaires.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun commentaire.</p>
        ) : (
          <div className="space-y-3">
            {occurrence.commentaires.map(c => (
              <div key={c.id}>
                <CommentaireItem c={c} />
                <button onClick={() => setRepondreA(repondreA === c.id ? null : c.id)}
                  className="text-xs text-slate-400 hover:text-primary ml-1 mb-2">
                  Répondre
                </button>
                {repondreA === c.id && (
                  <form onSubmit={e => handleCommentaire(e, c.id)} className="ml-8 flex gap-2 mb-3">
                    <input className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Votre réponse…"
                      value={reponseTexte} onChange={e => setReponseTexte(e.target.value)} />
                    <button type="submit" disabled={!reponseTexte.trim() || saving}
                      className="bg-primary text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50">
                      <Send size={14} />
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Nouveau commentaire */}
        <form onSubmit={e => handleCommentaire(e)} className="flex gap-3 pt-3 border-t border-slate-100">
          <textarea
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
            rows={2} placeholder="Ajouter un commentaire…"
            value={commentaireTexte} onChange={e => setCommentaireTexte(e.target.value)}
          />
          <button type="submit" disabled={!commentaireTexte.trim() || saving}
            className="flex-shrink-0 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
            <Send size={14} /> Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}
