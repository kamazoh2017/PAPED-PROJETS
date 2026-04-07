'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Clock, CheckCircle2, Calendar } from 'lucide-react';

interface Entite { id: string; libelle: string }
interface Personne { id: string; nom: string; prenoms: string; entite: Entite }

interface Occurrence {
  id: string;
  datePrevue: string;
  dateEcheance: string;
  dateRealisation?: string | null;
  statut: string;
  retardJours?: number | null;
  realisePar?: Personne | null;
  tacheOperationnelle: {
    id: string;
    libelle: string;
    periodicite: string;
    operation: { id: string; libelle: string; entite?: Entite | null };
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
  QUOTIDIENNE: 'Quot.', HEBDOMADAIRE: 'Hebdo.', MENSUELLE: 'Mens.',
  TRIMESTRIELLE: 'Trim.', SEMESTRIELLE: 'Semest.', ANNUELLE: 'Annuelle', AD_HOC: 'Ad hoc',
};

function fmtDate(d?: string | null) {
  return d ? new Date(d).toLocaleDateString('fr-FR') : '—';
}

function isAujourdhui(d: string) {
  const today = new Date().toLocaleDateString('fr-FR');
  return new Date(d).toLocaleDateString('fr-FR') === today;
}

function isCetteSemaine(d: string) {
  const now = new Date();
  const fin7 = new Date(now); fin7.setDate(now.getDate() + 7);
  const date = new Date(d);
  return date >= now && date <= fin7;
}

function StatutBadge({ statut }: { statut: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={STATUT_STYLE[statut] ?? {}}>
      {statut}
    </span>
  );
}

function LigneOccurrence({ o }: { o: Occurrence }) {
  return (
    <tr className="hover:bg-slate-50 transition">
      <td className="px-4 py-2.5">
        <Link href={`/occurrences/${o.id}`} className="text-primary hover:underline font-medium text-sm">
          {o.tacheOperationnelle.libelle}
        </Link>
        <p className="text-xs text-slate-400 mt-0.5">
          <Link href={`/operations/${o.tacheOperationnelle.operation.id}`} className="hover:underline">
            {o.tacheOperationnelle.operation.libelle}
          </Link>
          {o.tacheOperationnelle.operation.entite && (
            <> · {o.tacheOperationnelle.operation.entite.libelle}</>
          )}
        </p>
      </td>
      <td className="px-4 py-2.5 text-xs text-slate-600 whitespace-nowrap">{fmtDate(o.datePrevue)}</td>
      <td className="px-4 py-2.5 text-xs text-slate-600 whitespace-nowrap">{fmtDate(o.dateEcheance)}</td>
      <td className="px-4 py-2.5"><StatutBadge statut={o.statut} /></td>
      <td className="px-4 py-2.5 text-xs text-slate-500">
        {o.realisePar ? `${o.realisePar.nom} ${o.realisePar.prenoms}` : '—'}
      </td>
      <td className="px-4 py-2.5 text-right text-xs">
        {o.retardJours != null && o.retardJours > 0
          ? <span className="text-red-500 font-semibold">+{o.retardJours}j</span>
          : <span className="text-slate-300">—</span>}
      </td>
    </tr>
  );
}

type VueType = 'mes-occurrences' | 'toutes' | 'calendrier';

export default function OccurrencesPage() {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading]         = useState(true);
  const [vue, setVue]                 = useState<VueType>('mes-occurrences');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [moisCalendrier, setMoisCalendrier] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetch('/api/occurrences')
      .then(r => r.json())
      .then(d => setOccurrences(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  // ── Sections "Mes occurrences" ────────────────────────────────────────────
  const enRetard    = occurrences.filter(o => o.statut === 'En retard');
  const aujourd_hui = occurrences.filter(o => (o.statut === 'En attente' || o.statut === 'En cours') && isAujourdhui(o.dateEcheance));
  const semaine     = occurrences.filter(o => (o.statut === 'En attente' || o.statut === 'En cours') && !isAujourdhui(o.dateEcheance) && isCetteSemaine(o.dateEcheance));
  const aVenir      = occurrences.filter(o => o.statut === 'En attente' && !isCetteSemaine(o.datePrevue) && new Date(o.datePrevue) > new Date());

  // ── "Toutes" avec filtre ──────────────────────────────────────────────────
  const toutesFiltre = occurrences.filter(o => !filtreStatut || o.statut === filtreStatut);

  // ── Calendrier ────────────────────────────────────────────────────────────
  const [annee, moisIdx] = moisCalendrier.split('-').map(Number);
  const premierJour = new Date(annee, moisIdx - 1, 1);
  const dernierJour = new Date(annee, moisIdx, 0);
  const offsetDebut = (premierJour.getDay() + 6) % 7; // lundi = 0
  const occsCalendrier = occurrences.filter(o => {
    const d = new Date(o.datePrevue);
    return d >= premierJour && d <= dernierJour;
  });
  const parJour: Record<number, Occurrence[]> = {};
  occsCalendrier.forEach(o => {
    const j = new Date(o.datePrevue).getDate();
    if (!parJour[j]) parJour[j] = [];
    parJour[j].push(o);
  });

  const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  function SectionMesOccurrences({ titre, items, icon }: { titre: string; items: Occurrence[]; icon: React.ReactNode }) {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h3 className="font-semibold text-slate-700">{titre}</h3>
          <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">{items.length}</span>
        </div>
        <div className="space-y-2">
          {items.map(o => (
            <Link key={o.id} href={`/occurrences/${o.id}`}
              className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 hover:shadow-sm hover:border-primary/30 transition group">
              <div className="min-w-0">
                <p className="font-medium text-sm text-slate-800 group-hover:text-primary truncate">
                  {o.tacheOperationnelle.libelle}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {o.tacheOperationnelle.operation.libelle}
                  {o.tacheOperationnelle.operation.entite && ` · ${o.tacheOperationnelle.operation.entite.libelle}`}
                  {' · '}{PERIODICITE_LABEL[o.tacheOperationnelle.periodicite] ?? o.tacheOperationnelle.periodicite}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                <span className="text-xs text-slate-500">Échéance : {fmtDate(o.dateEcheance)}</span>
                <StatutBadge statut={o.statut} />
                {o.retardJours != null && o.retardJours > 0 && (
                  <span className="text-xs font-semibold text-red-500">+{o.retardJours}j</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-primary">Occurrences</h1>

      {/* Onglets de vue */}
      <div className="flex border-b border-slate-200">
        {([
          { key: 'mes-occurrences', label: 'Mes occurrences' },
          { key: 'toutes',          label: 'Toutes les occurrences' },
          { key: 'calendrier',      label: 'Calendrier' },
        ] as { key: VueType; label: string }[]).map(({ key, label }) => (
          <button key={key} onClick={() => setVue(key)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${vue === key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-slate-400">Chargement…</p> : (
        <>
          {/* ── Vue Mes occurrences ───────────────────────────────────────── */}
          {vue === 'mes-occurrences' && (
            <div>
              {enRetard.length === 0 && aujourd_hui.length === 0 && semaine.length === 0 && aVenir.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <CheckCircle2 size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Aucune occurrence en attente. Tout est à jour !</p>
                </div>
              ) : (
                <>
                  <SectionMesOccurrences titre="En retard" items={enRetard}
                    icon={<AlertCircle size={16} className="text-red-500" />} />
                  <SectionMesOccurrences titre="À faire aujourd'hui" items={aujourd_hui}
                    icon={<Clock size={16} className="text-orange-500" />} />
                  <SectionMesOccurrences titre="Cette semaine" items={semaine}
                    icon={<Clock size={16} className="text-blue-500" />} />
                  <SectionMesOccurrences titre="À venir" items={aVenir}
                    icon={<Calendar size={16} className="text-slate-400" />} />
                </>
              )}
            </div>
          )}

          {/* ── Vue Toutes ────────────────────────────────────────────────── */}
          {vue === 'toutes' && (
            <div>
              <div className="flex gap-3 mb-4">
                <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value="">Tous les statuts</option>
                  {Object.keys(STATUT_STYLE).map(s => <option key={s}>{s}</option>)}
                </select>
                {filtreStatut && (
                  <button onClick={() => setFiltreStatut('')}
                    className="px-3 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg bg-white hover:bg-slate-50">
                    Réinitialiser
                  </button>
                )}
                <span className="ml-auto text-sm text-slate-400 self-center">{toutesFiltre.length} résultat{toutesFiltre.length > 1 ? 's' : ''}</span>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {toutesFiltre.length === 0 ? (
                  <p className="text-center text-slate-400 py-12">Aucune occurrence.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Tâche / Opération</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Date prévue</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Échéance</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Statut</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Réalisé par</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-600">Retard</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {toutesFiltre.map(o => <LigneOccurrence key={o.id} o={o} />)}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── Vue Calendrier ────────────────────────────────────────────── */}
          {vue === 'calendrier' && (
            <div>
              {/* Navigation mois */}
              <div className="flex items-center gap-4 mb-4">
                <button onClick={() => {
                  const [y, m] = moisCalendrier.split('-').map(Number);
                  const prev = new Date(y, m - 2, 1);
                  setMoisCalendrier(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
                }} className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50">‹</button>
                <h2 className="font-semibold text-slate-700 min-w-[160px] text-center">
                  {MOIS_NOMS[moisIdx - 1]} {annee}
                </h2>
                <button onClick={() => {
                  const [y, m] = moisCalendrier.split('-').map(Number);
                  const next = new Date(y, m, 1);
                  setMoisCalendrier(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
                }} className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50">›</button>
                <span className="text-xs text-slate-400">{occsCalendrier.length} occurrence{occsCalendrier.length > 1 ? 's' : ''} ce mois</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {/* Entêtes jours */}
                <div className="grid grid-cols-7 border-b border-slate-200">
                  {JOURS.map(j => (
                    <div key={j} className="text-center text-xs font-semibold text-slate-500 py-2">{j}</div>
                  ))}
                </div>
                {/* Grille */}
                <div className="grid grid-cols-7">
                  {/* Cellules vides avant le 1er */}
                  {Array.from({ length: offsetDebut }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-slate-100 bg-slate-50/50" />
                  ))}
                  {/* Jours du mois */}
                  {Array.from({ length: dernierJour.getDate() }).map((_, i) => {
                    const jour = i + 1;
                    const occs = parJour[jour] ?? [];
                    const today = new Date();
                    const isToday = today.getDate() === jour && today.getMonth() === moisIdx - 1 && today.getFullYear() === annee;
                    return (
                      <div key={jour} className={`min-h-[80px] border-b border-r border-slate-100 p-1.5 ${isToday ? 'bg-blue-50' : ''}`}>
                        <span className={`text-xs font-semibold ${isToday ? 'text-primary' : 'text-slate-400'}`}>{jour}</span>
                        <div className="mt-1 space-y-0.5">
                          {occs.slice(0, 3).map(o => {
                            const couleur =
                              o.statut === 'En retard' ? '#fecaca' :
                              o.statut === 'Réalisée'  ? '#bbf7d0' :
                              o.statut === 'En cours'  ? '#fed7aa' :
                              o.statut === 'Annulée'   ? '#e2e8f0' : '#bfdbfe';
                            return (
                              <Link key={o.id} href={`/occurrences/${o.id}`}
                                className="block truncate text-xs px-1 py-0.5 rounded"
                                style={{ background: couleur }}>
                                {o.tacheOperationnelle.libelle}
                              </Link>
                            );
                          })}
                          {occs.length > 3 && (
                            <span className="text-xs text-slate-400">+{occs.length - 3}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Légende */}
              <div className="flex gap-4 mt-3 text-xs text-slate-500">
                {[
                  { couleur: '#bfdbfe', label: 'En attente' },
                  { couleur: '#fed7aa', label: 'En cours' },
                  { couleur: '#bbf7d0', label: 'Réalisée' },
                  { couleur: '#fecaca', label: 'En retard' },
                  { couleur: '#e2e8f0', label: 'Annulée' },
                ].map(({ couleur, label }) => (
                  <span key={label} className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded" style={{ background: couleur }} />{label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
