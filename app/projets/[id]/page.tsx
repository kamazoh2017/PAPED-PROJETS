'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Users, Building2, CheckCircle2, Plus, X, MessageSquare, CornerDownRight, Send, Trash2, ShieldCheck, AlertCircle, AlertTriangle, ShieldAlert, ChevronDown, Search, Pencil, Check, ChevronRight, ArrowLeft, Lock, ListChecks } from 'lucide-react';
import { ROLES_PARTIE_PRENANTE, NIVEAUX_INFLUENCE_INTERET, TYPE_ACTEUR } from '@/lib/parties-prenantes-constants';
import ProjectGantt from '@/components/ProjectGantt';
import ReportingTab from './ReportingTab';

interface Entite {
  id: string;
  libelle: string;
  tutelle?: string;
}

interface Personne {
  id: string;
  nom: string;
  prenoms: string;
  fonction: string;
  email: string;
  telephone?: string;
  entite: Entite;
  estChefProjet?: boolean;
}

interface CompteAccesInfo {
  id: string;
  login?: string;
  personne?: Personne | null;
}

interface Activite {
  id: string;
  type: string;
  detail: string;
  dateCreation: string;
  compte?: { login?: string; personne?: { nom: string; prenoms: string } | null } | null;
}

interface Commentaire {
  id: string;
  contenu: string;
  dateCreation: string;
  compteAcces: CompteAccesInfo;
  reponses: Commentaire[];
}

interface Tache {
  id: string;
  libelle: string;
  description?: string;
  priorite: string;
  statut: string;
  dateCreation: string;
  dateDebutPrevisionnelle?: string;
  dateFinPrevisionnelle?: string;
  dateDebutEffective?: string;
  dateFinEffective?: string;
  assigneAId?: string;
  assigneA?: Personne;
  commentaires?: Commentaire[];
}

interface ActeurCollectif {
  id: string;
  libelle: string;
  description?: string;
}

interface PartiePrenante {
  id: string;
  projetId: string;
  typeActeur: 'ORGANISATIONNEL' | 'ACTEUR_COLLECTIF_NON_ORGANISATIONNEL';
  ressourceId?: string | null;
  acteurCollectifId?: string | null;
  role: string;
  influence: string;
  interet: string;
  attentesTexte?: string | null;
  strategieCommunication?: string | null;
  notes?: string | null;
  ressource?: (Personne & { entite?: Entite }) | null;
  acteurCollectif?: ActeurCollectif | null;
}

interface RisqueProjet {
  libelle: string;
  taux: number;
  gravite: string;
  couleur: string;
}

interface Projet {
  id: string;
  libelle: string;
  description?: string;
  statut: string;
  etatAvancement?: string;
  tauxAvancementReel?: number;
  tauxAvancementAttendu?: number;
  tauxAchevementReel?: number;
  tauxAchevementAttendu?: number;
  dateDebutPrevisionnelle?: string;
  dateFinPrevisionnelle?: string;
  dateDebutEffective?: string;
  dateFinEffective?: string;
  chefProjet: Personne;
  equipeProjet: Personne[];
  taches: Tache[];
  partiesPrenantes: PartiePrenante[];
  risques?: RisqueProjet[];
  entitePorteuse?: { id: string; libelle: string; typeEntite?: string | null } | null;
}

const PRIORITE_COLORS: Record<string, string> = {
  Bloquant: 'bg-red-100 text-red-700 border-red-200',
  Critique: 'bg-amber-100 text-amber-700 border-amber-200',
  Normal: 'bg-green-100 text-green-700 border-green-200',
  Haute: 'bg-red-100 text-red-700 border-red-200',
  Moyenne: 'bg-amber-100 text-amber-700 border-amber-200',
  Basse: 'bg-green-100 text-green-700 border-green-200',
};

const PRIORITE_CARD_BG: Record<string, string> = {
  Bloquant: 'bg-red-50',
  Critique: 'bg-amber-50',
  Normal: 'bg-green-50',
};

function normalizePriority(value?: string): 'Bloquant' | 'Critique' | 'Normal' {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'haute' || raw === 'bloquant') return 'Bloquant';
  if (raw === 'moyenne' || raw === 'moyen' || raw === 'critique') return 'Critique';
  if (raw === 'basse' || raw === 'faible' || raw === 'normal') return 'Normal';
  return 'Critique';
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function toInputDate(iso?: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function getAvancement(task: Tache): 'retard' | 'en-avance' | 'hors-delai' {
  const isDone = task.statut === 'Terminé' || task.statut === 'Validé';
  const finPrev = task.dateFinPrevisionnelle ? new Date(task.dateFinPrevisionnelle).getTime() : null;
  const debutPrev = task.dateDebutPrevisionnelle ? new Date(task.dateDebutPrevisionnelle).getTime() : null;
  const now = Date.now();
  if (!isDone && finPrev && finPrev <= now) return 'hors-delai';
  if (isDone) return 'en-avance';
  if (debutPrev && debutPrev <= now) return 'retard';
  return 'en-avance';
}

function getAuthorName(c: CompteAccesInfo): string {
  if (c.personne) return `${c.personne.prenoms} ${c.personne.nom}`;
  return c.login ?? 'Compte inconnu';
}

function getActiviteAuthor(a: Activite): string {
  if (a.compte?.personne) return `${a.compte.personne.prenoms} ${a.compte.personne.nom}`;
  return a.compte?.login ?? 'Système';
}

function formatActiviteDetail(type: string, detail: string): string {
  try {
    const d = JSON.parse(detail);
    if (type === 'changement_statut') {
      return `Statut : ${d.avant ?? '—'} → ${d.apres ?? '—'}`;
    }
    if (type === 'assignation') {
      if (!d.avant && d.apres) return `Assigné à ${d.apres}`;
      if (d.avant && !d.apres) return `Désassigné (était : ${d.avant})`;
      return `Réassigné : ${d.avant} → ${d.apres}`;
    }
    if (type === 'creation') return `Tâche créée (statut : ${d.statut ?? '—'})`;
  } catch {
    // fall through
  }
  return type;
}

const ACTIVITE_COLORS: Record<string, string> = {
  creation:          'bg-blue-100 text-blue-700',
  changement_statut: 'bg-amber-100 text-amber-700',
  assignation:       'bg-purple-100 text-purple-700',
};

const AVANCEMENT_BORDER_LEFT: Record<string, string> = {
  retard:       'border-l-orange-500',
  'en-avance':  'border-l-green-500',
  'hors-delai': 'border-l-red-500',
};

const AVANCEMENT_BADGE: Record<string, { label: string; classes: string }> = {
  'a-lheure':   { label: 'À l\'heure', classes: 'bg-blue-100 text-blue-700' },
  retard:       { label: 'En retard',  classes: 'bg-orange-100 text-orange-700' },
  'en-avance':  { label: 'En avance',  classes: 'bg-green-100 text-green-700' },
  'hors-delai': { label: 'Hors délai', classes: 'bg-red-100 text-red-700' },
};

const RISQUE_CONFIG: Record<string, { label: string; classes: string; Icon: React.ElementType }> = {
  Faible:   { label: 'Faible',   classes: 'bg-green-100 text-green-700',  Icon: ShieldCheck    },
  Moyen:    { label: 'Moyen',    classes: 'bg-yellow-100 text-yellow-700', Icon: AlertCircle   },
  'Élevé':  { label: 'Élevé',   classes: 'bg-orange-100 text-orange-700', Icon: AlertTriangle },
  Critique: { label: 'Critique', classes: 'bg-red-100 text-red-700',       Icon: ShieldAlert   },
};

function getAvanancementProjet(projet: Projet): 'retard' | 'en-avance' | 'hors-delai' | null {
  const STATUTS_ACTIFS = ['En démarrage', 'En cours'];
  if (!STATUTS_ACTIFS.includes(projet.statut)) return null;

  const now = Date.now();
  const fin = projet.dateFinPrevisionnelle ? new Date(projet.dateFinPrevisionnelle).getTime() : null;
  const tasks = projet.taches ?? [];
  const totalTasks = tasks.length;

  // Si la date prévisionnelle de fin est dépassée
  if (fin && fin <= now) {
    if (totalTasks === 0) return 'hors-delai';
    const doneTasks = tasks.filter((t) => t.statut === 'Terminé' || t.statut === 'Validé').length;
    return doneTasks < totalTasks ? 'hors-delai' : 'en-avance';
  }

  // Date non dépassée — comparer taux effectif vs taux prévisionnel
  if (totalTasks === 0) return 'en-avance';
  const doneTasks = tasks.filter((t) => t.statut === 'Terminé' || t.statut === 'Validé').length;
  const tauxEffectif = doneTasks / totalTasks;
  const tasksDuByNow = tasks.filter((t) => {
    const fp = t.dateFinPrevisionnelle ? new Date(t.dateFinPrevisionnelle).getTime() : null;
    return fp !== null && fp <= now;
  }).length;
  const tauxPrevisionnel = tasksDuByNow / totalTasks;

  return tauxEffectif < tauxPrevisionnel ? 'retard' : 'en-avance';
}

const STATUT_COLORS: Record<string, string> = {
  'À planifier': 'bg-slate-100 text-slate-600',
  'A faire':     'bg-blue-100 text-blue-700',
  'En cours':    'bg-amber-100 text-amber-700',
  'En attente':  'bg-red-100 text-red-700',
  'Terminé':     'bg-green-100 text-green-700',
  'Validé':      'bg-emerald-100 text-emerald-700',
};

function getProjetStatutStyle(statut: string): React.CSSProperties {
  switch (statut) {
    case 'En démarrage': return { backgroundColor: '#dbeafe', color: '#1d4ed8' };
    case 'En cours':     return { backgroundColor: '#ffedd5', color: '#c2410c' };
    case 'Terminé':      return { backgroundColor: '#dcfce7', color: '#15803d' };
    case 'Clôturé':      return { backgroundColor: '#065f46', color: '#ffffff' };
    case 'Suspendu':     return { backgroundColor: '#fee2e2', color: '#b91c1c' };
    default:             return { backgroundColor: '#dbeafe', color: '#1d4ed8' };
  }
}

const STATUTS_EXECUTION = ['À planifier', 'A faire', 'En cours', 'En attente', 'Terminé', 'Validé'] as const;

const KANBAN_COLUMNS = ['A faire', 'En cours', 'Terminé', 'Validé', 'En attente'] as const;

const KANBAN_CONFIG: Record<string, { label: string; borderColor: string; headerClass: string }> = {
  'A faire':    { label: 'À faire',    borderColor: 'border-t-blue-400',  headerClass: 'bg-blue-50 text-blue-700' },
  'En cours':   { label: 'En cours',   borderColor: 'border-t-amber-400', headerClass: 'bg-amber-50 text-amber-700' },
  'Terminé':    { label: 'Terminé',    borderColor: 'border-t-green-400', headerClass: 'bg-green-50 text-green-700' },
  'Validé':     { label: 'Validé',     borderColor: 'border-t-emerald-500', headerClass: 'bg-emerald-50 text-emerald-700' },
  'En attente': { label: 'En attente', borderColor: 'border-t-red-400',   headerClass: 'bg-red-50 text-red-700' },
};

function getAllowedNextStatuts(task: Tache): string[] {
  const today = new Date().toISOString().slice(0, 10);
  const debutPrev = task.dateDebutPrevisionnelle ? task.dateDebutPrevisionnelle.slice(0, 10) : null;
  const hasStarted = !!task.dateDebutEffective;

  return ([...STATUTS_EXECUTION] as string[]).filter(s => {
    if (s === task.statut) return true;
    // Retour en arrière bloqué si déjà démarrée
    if (s === 'À planifier') return !hasStarted;
    if (s === 'A faire') {
      if (!hasStarted) return true;
      return debutPrev !== null && today < debutPrev;
    }
    // "En attente" = bloqué/en pause : accessible depuis tout statut non terminal
    if (s === 'En attente') return task.statut !== 'Terminé' && task.statut !== 'Validé';
    return true;
  });
}

type TabKey = 'infos' | 'liste-taches' | 'execution' | 'gantt' | 'detail' | 'reporting' | 'dashboard';

const STATUTS_PROJET = [
  'En démarrage',
  'En cours',
  'Terminé',
  'Clôturé',
  'Suspendu',
];

// ─── Composant MultiSelect ────────────────────────────────────────────────────

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}

function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [open, setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  function toggle(v: string) {
    onChange(selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v]);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border whitespace-nowrap transition-colors ${
          selected.length > 0
            ? 'border-primary bg-primary/10 text-primary font-semibold'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
        }`}
      >
        <span className="text-slate-400 mr-0.5">{label}:</span>
        {selected.length === 0 ? 'Tout' : `${selected.length} sél.`}
        <ChevronDown size={11} />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg min-w-[190px] p-2 space-y-1.5">
          <div className="relative">
            <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-6 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="max-h-44 overflow-y-auto space-y-0.5">
            <button
              type="button"
              onClick={() => onChange([])}
              className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-slate-50 ${selected.length === 0 ? 'font-semibold text-primary' : 'text-slate-600'}`}
            >
              Tout
            </button>
            {filtered.map(o => (
              <label key={o} className="flex items-center gap-2 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 rounded cursor-pointer">
                <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)} className="rounded accent-primary" />
                {o}
              </label>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-1">
            <button
              type="button"
              onClick={() => { onChange([]); setSearch(''); }}
              className="w-full text-xs text-slate-400 hover:text-slate-600 py-0.5 text-center"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Composant TaskSearchSelect ───────────────────────────────────────────────

interface TaskSearchSelectProps {
  taches: Tache[];
  selectedId: string | null;
  onSelect: (t: Tache) => void;
}

function TaskSearchSelect({ taches, selectedId, onSelect }: TaskSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const selected = selectedId ? taches.find(t => t.id === selectedId) : null;
  const filtered = taches.filter(t => t.libelle.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border whitespace-nowrap transition-colors border-slate-200 bg-white text-slate-600 hover:border-slate-300 max-w-[220px]"
      >
        <span className="truncate">{selected ? selected.libelle : `— Tâche (${taches.length}) —`}</span>
        <ChevronDown size={11} className="flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute top-full right-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg w-72 p-2 space-y-1.5">
          <div className="relative">
            <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              type="text"
              placeholder="Rechercher une tâche…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-6 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-400 px-2 py-1">Aucune tâche trouvée.</p>
            ) : filtered.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => { onSelect(t); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
                  t.id === selectedId ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                {t.libelle}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT : Registre des parties prenantes
// ─────────────────────────────────────────────────────────────────────────────

const BADGE_NIVEAU: Record<string, string> = {
  Faible:   'bg-green-100 text-green-700',
  Moyen:    'bg-yellow-100 text-yellow-700',
  Élevé:    'bg-orange-100 text-orange-700',
  Critique: 'bg-red-100 text-red-700',
};

function RegistrePartiesPrenantes({
  projetId, partiesPrenantes, ressources, onRefresh,
}: {
  projetId: string;
  partiesPrenantes: PartiePrenante[];
  ressources: Personne[];
  onRefresh: () => void;
}) {
  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [etape, setEtape] = useState<1 | 2 | 3 | 4>(1);
  const [typeActeur, setTypeActeur] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [wizardError, setWizardError] = useState('');

  // Étape 3A — organisationnel
  const [ressourcesSelectionnees, setRessourcesSelectionnees] = useState<string[]>([]);

  // Étape 3B — acteur collectif
  const [acteurs, setActeurs] = useState<ActeurCollectif[]>([]);
  const [acteurSelId, setActeurSelId] = useState('');
  const [nouvelActeur, setNouvelActeur] = useState({ libelle: '', description: '' });
  const [creerNouvelActeur, setCreerNouvelActeur] = useState(false);

  // Étape 4 — infos communes
  const FORM_VIDE = { role: '', influence: 'Moyen', interet: 'Moyen', attentesTexte: '', strategieCommunication: '', notes: '' };
  const [form, setForm] = useState(FORM_VIDE);

  // Ligne en édition
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(FORM_VIDE);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Expandé
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const resetWizard = () => {
    setEtape(1); setTypeActeur(''); setRessourcesSelectionnees([]);
    setActeurSelId(''); setNouvelActeur({ libelle: '', description: '' }); setCreerNouvelActeur(false);
    setForm(FORM_VIDE); setWizardError(''); setSaving(false);
  };

  const fetchActeurs = async () => {
    const res = await fetch('/api/acteurs-collectifs');
    const d = await res.json();
    setActeurs(Array.isArray(d) ? d : []);
  };

  const openWizard = () => { resetWizard(); fetchActeurs(); setShowWizard(true); };

  const goEtape3 = () => {
    if (!typeActeur) { setWizardError('Choisissez un type.'); return; }
    setWizardError('');
    setEtape(typeActeur === TYPE_ACTEUR.ORGANISATIONNEL ? 3 : (fetchActeurs(), 3));
  };

  const goEtape4 = () => {
    if (typeActeur === TYPE_ACTEUR.ORGANISATIONNEL && ressourcesSelectionnees.length === 0) {
      setWizardError('Sélectionnez au moins une ressource.'); return;
    }
    if (typeActeur === TYPE_ACTEUR.ACTEUR_COLLECTIF && !acteurSelId && !creerNouvelActeur) {
      setWizardError('Choisissez ou créez un acteur collectif.'); return;
    }
    setWizardError(''); setEtape(4);
  };

  const handleSubmit = async () => {
    if (!form.role) { setWizardError('Le rôle est obligatoire.'); return; }
    setSaving(true); setWizardError('');

    try {
      // Pour les acteurs organisationnels, on peut avoir plusieurs ressources → une PP par ressource
      const targets = typeActeur === TYPE_ACTEUR.ORGANISATIONNEL
        ? ressourcesSelectionnees
        : [null];

      // Si nouvel acteur collectif, le créer d'abord
      let acId = acteurSelId;
      if (typeActeur === TYPE_ACTEUR.ACTEUR_COLLECTIF && creerNouvelActeur) {
        const r = await fetch('/api/acteurs-collectifs', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nouvelActeur),
        });
        if (!r.ok) { setWizardError((await r.json()).error || 'Erreur création acteur.'); setSaving(false); return; }
        acId = (await r.json()).id;
      }

      for (const rid of targets) {
        const body = {
          typeActeur,
          ressourceId:       typeActeur === TYPE_ACTEUR.ORGANISATIONNEL ? rid : undefined,
          acteurCollectifId: typeActeur === TYPE_ACTEUR.ACTEUR_COLLECTIF ? acId : undefined,
          ...form,
        };
        const res = await fetch(`/api/projets/${projetId}/parties-prenantes`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) { setWizardError((await res.json()).error || 'Erreur.'); setSaving(false); return; }
      }

      onRefresh(); setShowWizard(false); resetWizard();
    } catch { setWizardError('Erreur réseau.'); }
    finally { setSaving(false); }
  };

  const handleEdit = async (id: string) => {
    setEditSaving(true);
    try {
      const res = await fetch(`/api/projets/${projetId}/parties-prenantes/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) return;
      onRefresh(); setEditId(null);
    } finally { setEditSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/projets/${projetId}/parties-prenantes/${id}`, { method: 'DELETE' });
    onRefresh(); setDeleteId(null);
  };

  const labelActeur = (pp: PartiePrenante) =>
    pp.typeActeur === 'ORGANISATIONNEL'
      ? `${pp.ressource?.prenoms} ${pp.ressource?.nom} · ${pp.ressource?.entite?.libelle ?? '—'}`
      : pp.acteurCollectif?.libelle ?? '—';

  // ── Wizard modal ──
  const Wizard = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Ajouter une partie prenante</h3>
            <p className="text-xs text-slate-400 mt-0.5">Étape {etape} / 4</p>
          </div>
          <button onClick={() => setShowWizard(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        {/* Étape 1 : type */}
        {etape === 1 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Type d'acteur</p>
            {[
              { val: TYPE_ACTEUR.ORGANISATIONNEL, label: 'Organisationnel', desc: 'Une direction, un service, un programme (représenté par une ressource)' },
              { val: TYPE_ACTEUR.ACTEUR_COLLECTIF, label: 'Acteur collectif non organisationnel', desc: 'Groupe, association, communauté, partenaire externe…' },
            ].map(opt => (
              <button
                key={opt.val}
                onClick={() => setTypeActeur(opt.val)}
                className={`w-full text-left border rounded-xl p-4 transition-colors ${typeActeur === opt.val ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
              </button>
            ))}
            {wizardError && <p className="text-xs text-red-600">{wizardError}</p>}
            <div className="flex justify-end">
              <button onClick={goEtape3} className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1">
                Suivant <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Étape 3A : organisationnel — choix ressources */}
        {etape === 3 && typeActeur === TYPE_ACTEUR.ORGANISATIONNEL && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Sélectionner les ressources (point focal)</p>
            <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-50">
              {ressources.map(r => {
                const checked = ressourcesSelectionnees.includes(r.id);
                return (
                  <label key={r.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 ${checked ? 'bg-primary/5' : ''}`}>
                    <input
                      type="checkbox" checked={checked}
                      onChange={() => setRessourcesSelectionnees(prev =>
                        checked ? prev.filter(x => x !== r.id) : [...prev, r.id]
                      )}
                      className="accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{r.prenoms} {r.nom}</p>
                      <p className="text-xs text-slate-400">{r.fonction} · {(r as any).entite?.libelle ?? '—'}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            {wizardError && <p className="text-xs text-red-600">{wizardError}</p>}
            <div className="flex justify-between">
              <button onClick={() => { setEtape(1); setWizardError(''); }} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"><ArrowLeft size={13} /> Retour</button>
              <button onClick={goEtape4} className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1">Suivant <ChevronRight size={14} /></button>
            </div>
          </div>
        )}

        {/* Étape 3B : acteur collectif */}
        {etape === 3 && typeActeur === TYPE_ACTEUR.ACTEUR_COLLECTIF && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Acteur collectif</p>
            {!creerNouvelActeur ? (
              <>
                <select
                  value={acteurSelId}
                  onChange={e => setActeurSelId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">— Sélectionner un acteur existant —</option>
                  {acteurs.map(a => <option key={a.id} value={a.id}>{a.libelle}</option>)}
                </select>
                <button onClick={() => setCreerNouvelActeur(true)} className="text-xs text-primary hover:underline">+ Créer un nouvel acteur collectif</button>
              </>
            ) : (
              <div className="space-y-2">
                <input
                  placeholder="Libellé *"
                  value={nouvelActeur.libelle}
                  onChange={e => setNouvelActeur(p => ({ ...p, libelle: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
                <textarea
                  placeholder="Description"
                  value={nouvelActeur.description}
                  onChange={e => setNouvelActeur(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  rows={2}
                />
                <button onClick={() => setCreerNouvelActeur(false)} className="text-xs text-slate-500 hover:underline">Choisir un existant</button>
              </div>
            )}
            {wizardError && <p className="text-xs text-red-600">{wizardError}</p>}
            <div className="flex justify-between">
              <button onClick={() => { setEtape(1); setWizardError(''); }} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"><ArrowLeft size={13} /> Retour</button>
              <button onClick={goEtape4} className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1">Suivant <ChevronRight size={14} /></button>
            </div>
          </div>
        )}

        {/* Étape 4 : infos communes */}
        {etape === 4 && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Rôle <span className="text-red-500">*</span></label>
              <input
                list="roles-pp" value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                placeholder="Sélectionner ou saisir un rôle"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <datalist id="roles-pp">
                {ROLES_PARTIE_PRENANTE.map(r => <option key={r} value={r} />)}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['influence', 'interet'] as const).map(field => (
                <div key={field}>
                  <label className="block text-xs font-medium text-slate-600 mb-1 capitalize">{field === 'interet' ? 'Intérêt' : 'Influence'}</label>
                  <select value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    {NIVEAUX_INFLUENCE_INTERET.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Attentes <span className="text-slate-400 font-normal">(une par ligne, sera stocké sous forme de liste à tirets)</span></label>
              <textarea
                value={form.attentesTexte}
                onChange={e => setForm(p => ({ ...p, attentesTexte: e.target.value }))}
                placeholder="- Attente 1&#10;- Attente 2"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Stratégie de communication</label>
              <textarea value={form.strategieCommunication} onChange={e => setForm(p => ({ ...p, strategieCommunication: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" rows={2} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" rows={2} />
            </div>
            {wizardError && <p className="text-xs text-red-600">{wizardError}</p>}
            <div className="flex justify-between">
              <button onClick={() => { setEtape(3); setWizardError(''); }} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"><ArrowLeft size={13} /> Retour</button>
              <button onClick={handleSubmit} disabled={saving} className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold">
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-primary">Registre des parties prenantes</h2>
        <button onClick={openWizard} className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/90 text-white px-4 py-1.5 rounded-lg text-sm font-semibold">
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {/* Confirmation suppression */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg text-slate-800 mb-3">Supprimer cette partie prenante ?</h3>
            <p className="text-sm text-slate-500 mb-4">Cette action est irréversible.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 text-slate-700">Annuler</button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-700 text-white font-semibold">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {showWizard && <Wizard />}

      {partiesPrenantes.length === 0 ? (
        <p className="text-slate-400 text-sm">Aucune partie prenante enregistrée.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-100">
                <th className="text-left py-2.5 px-3 font-semibold">Acteur</th>
                <th className="text-left py-2.5 px-3 font-semibold">Rôle</th>
                <th className="text-left py-2.5 px-3 font-semibold">Influence</th>
                <th className="text-left py-2.5 px-3 font-semibold">Intérêt</th>
                <th className="py-2.5 px-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {partiesPrenantes.map(pp => (
                <>
                  <tr key={pp.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setExpandedId(expandedId === pp.id ? null : pp.id)}>
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-slate-800 text-sm">{labelActeur(pp)}</p>
                      <p className="text-xs text-slate-400">{pp.typeActeur === 'ORGANISATIONNEL' ? 'Organisationnel' : 'Acteur collectif'}</p>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-sm">{pp.role}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_NIVEAU[pp.influence] ?? ''}`}>{pp.influence}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_NIVEAU[pp.interet] ?? ''}`}>{pp.interet}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setEditId(pp.id); setEditForm({ role: pp.role, influence: pp.influence, interet: pp.interet, attentesTexte: pp.attentesTexte ?? '', strategieCommunication: pp.strategieCommunication ?? '', notes: pp.notes ?? '' }); }}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-primary"><Pencil size={13} /></button>
                        <button onClick={() => setDeleteId(pp.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>

                  {/* Ligne expandée */}
                  {expandedId === pp.id && (
                    <tr key={`${pp.id}-detail`} className="bg-slate-50">
                      <td colSpan={5} className="px-4 py-3">
                        {editId === pp.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-medium text-slate-600 block mb-1">Rôle</label>
                                <input list="roles-pp-edit" value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm" />
                                <datalist id="roles-pp-edit">{ROLES_PARTIE_PRENANTE.map(r => <option key={r} value={r} />)}</datalist>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {(['influence', 'interet'] as const).map(f => (
                                  <div key={f}>
                                    <label className="text-xs font-medium text-slate-600 block mb-1 capitalize">{f === 'interet' ? 'Intérêt' : 'Influence'}</label>
                                    <select value={editForm[f]} onChange={e => setEditForm(p => ({ ...p, [f]: e.target.value }))} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm">
                                      {NIVEAUX_INFLUENCE_INTERET.map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-600 block mb-1">Attentes</label>
                              <textarea value={editForm.attentesTexte} onChange={e => setEditForm(p => ({ ...p, attentesTexte: e.target.value }))} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono" rows={3} />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-600 block mb-1">Stratégie de communication</label>
                              <textarea value={editForm.strategieCommunication} onChange={e => setEditForm(p => ({ ...p, strategieCommunication: e.target.value }))} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm" rows={2} />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-600 block mb-1">Notes</label>
                              <textarea value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm" rows={2} />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleEdit(pp.id)} disabled={editSaving} className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg text-xs font-semibold">
                                <Check size={12} /> {editSaving ? 'Enreg…' : 'Enregistrer'}
                              </button>
                              <button onClick={() => setEditId(null)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"><X size={12} /> Annuler</button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            {pp.attentesTexte && (
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Attentes</p>
                                <ul className="space-y-0.5">
                                  {pp.attentesTexte.split('\n').filter(Boolean).map((ligne, i) => (
                                    <li key={i} className="text-slate-700 text-xs">{ligne.startsWith('-') ? ligne : `- ${ligne}`}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {pp.strategieCommunication && (
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Stratégie com.</p>
                                <p className="text-xs text-slate-700 whitespace-pre-line">{pp.strategieCommunication}</p>
                              </div>
                            )}
                            {pp.notes && (
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</p>
                                <p className="text-xs text-slate-700 whitespace-pre-line">{pp.notes}</p>
                              </div>
                            )}
                            {!pp.attentesTexte && !pp.strategieCommunication && !pp.notes && (
                              <p className="text-xs text-slate-400 col-span-3">Aucun détail renseigné.</p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ProjetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [projet, setProjet] = useState<Projet | null>(null);
  const [session, setSession] = useState<{ role: string; estSuperAdmin: boolean; personne?: { id: string } | null } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showOperationInduite, setShowOperationInduite] = useState(false);
  const [opInduiteForm, setOpInduiteForm] = useState({ libelle: '', description: '', dateDebut: '', entiteId: '', responsableId: '' });
  const [opInduiteError, setOpInduiteError] = useState('');
  const [opInduiteSaving, setOpInduiteSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ressources, setRessources] = useState<Personne[]>([]);
  const [toutesEntites, setToutesEntites] = useState<{ id: string; libelle: string; typeEntite?: string | null }[]>([]);
  const [showAddEquipe, setShowAddEquipe] = useState(false);
  const [addingEquipeIds, setAddingEquipeIds] = useState<string[]>([]);
  const [removingMembreId, setRemovingMembreId] = useState<string|null>(null);
  const [removingMembreLoading, setRemovingMembreLoading] = useState(false);

  useEffect(() => {
    fetch('/api/personnes').then(r => r.json()).then(d => setRessources(Array.isArray(d) ? d : []));
    fetch('/api/entites').then(r => r.json()).then(d => setToutesEntites(Array.isArray(d) ? d : []));
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => { if (d) setSession(d); }).catch(() => {});
  }, []);
  const [activeTab, setActiveTab] = useState<TabKey>('infos');

  // Task form state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFormError, setTaskFormError] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetCol, setDropTargetCol] = useState<string | null>(null);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [pendingMoveCol, setPendingMoveCol] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({
    libelle: '',
    description: '',
    priorite: 'Critique',
    assigneAId: '',
    dateDebutPrevisionnelle: '',
    dateFinPrevisionnelle: '',
  });

  // Detail tab state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [detailEdit, setDetailEdit] = useState<any>({});
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [commentaireText, setCommentaireText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentaires, setCommentaires] = useState<Commentaire[]>([]);
  const [commentairesLoading, setCommentairesLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editCommentSaving, setEditCommentSaving] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [deleteCommentLoading, setDeleteCommentLoading] = useState(false);
  const [activites, setActivites] = useState<Activite[]>([]);
  const [activitesLoading, setActivitesLoading] = useState(false);
  // Task delete
  const [deleteTaskConfirm, setDeleteTaskConfirm] = useState(false);
  const [deleteTaskLoading, setDeleteTaskLoading] = useState(false);
  const [deleteTaskError, setDeleteTaskError] = useState('');

  // Sous-tâches (checklist)
  const [sousTaches, setSousTaches] = useState<{ id: string; libelle: string; estFaite: boolean; ordre: number }[]>([]);
  const [stLoading, setStLoading] = useState(false);
  const [stNewLibelle, setStNewLibelle] = useState('');
  const [stAdding, setStAdding] = useState(false);
  const [stEditId, setStEditId] = useState<string | null>(null);
  const [stEditLibelle, setStEditLibelle] = useState('');

  // ── Filtres liste des tâches ─────────────────────────────────────────────
  const [flTache,      setFlTache]      = useState('');
  const [flAssigne,    setFlAssigne]    = useState<string[]>([]);
  const [flPriorite,   setFlPriorite]   = useState<string[]>([]);
  const [flStatut,     setFlStatut]     = useState<string[]>([]);
  const [flAvancement, setFlAvancement] = useState<string[]>([]);
  const [flPeriodeDebut, setFlPeriodeDebut] = useState('');
  const [flPeriodeFin,   setFlPeriodeFin]   = useState('');

  // ── Filtres détail tâche ──────────────────────────────────────────────────
  const [dtAssigne,    setDtAssigne]    = useState<string[]>([]);
  const [dtPriorite,   setDtPriorite]   = useState<string[]>([]);
  const [dtStatut,     setDtStatut]     = useState<string[]>([]);
  const [dtAvancement, setDtAvancement] = useState<string[]>([]);

  useEffect(() => {
    if (projectId) fetchProjet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchProjet = async () => {
    try {
      const res = await fetch(`/api/projets/${projectId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && !data.error) {
        setProjet(data);
        if (selectedTaskId) {
          const t = (data.taches as Tache[]).find(t => t.id === selectedTaskId);
          if (t) syncDetailEdit(t);
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncDetailEdit = (t: Tache) => {
    setDetailEdit({
      libelle: t.libelle,
      description: t.description,
      priorite: normalizePriority(t.priorite),
      statut: t.statut,
      assigneAId: t.assigneAId ?? '',
      dateDebutPrevisionnelle: toInputDate(t.dateDebutPrevisionnelle),
      dateFinPrevisionnelle: toInputDate(t.dateFinPrevisionnelle),
      dateDebutEffective: toInputDate(t.dateDebutEffective),
      dateFinEffective: toInputDate(t.dateFinEffective),
    });
  };

  const fetchActivites = async (taskId: string) => {
    setActivitesLoading(true);
    try {
      const res = await fetch(`/api/taches/${taskId}/activites`);
      if (res.ok) {
        const data = await res.json();
        setActivites(Array.isArray(data) ? data : []);
      }
    } catch {
      // silently ignore
    } finally {
      setActivitesLoading(false);
    }
  };

  const fetchCommentaires = async (taskId: string) => {
    setCommentairesLoading(true);
    try {
      const res = await fetch(`/api/taches/${taskId}/commentaires`);
      if (res.ok) {
        const data = await res.json();
        setCommentaires(Array.isArray(data) ? data : []);
      }
    } catch {
      // silently ignore
    } finally {
      setCommentairesLoading(false);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskFormError('');

    if (!taskForm.assigneAId) {
      setTaskFormError("Veuillez assigner la tâche à un membre de l'équipe.");
      return;
    }
    if (!taskForm.dateDebutPrevisionnelle || !taskForm.dateFinPrevisionnelle) {
      setTaskFormError('Les dates prévisionnelles de début et fin sont obligatoires.');
      return;
    }

    try {
      const res = await fetch('/api/taches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projetId: projectId, ...taskForm }),
      });
      if (!res.ok) {
        const payload = await res.json();
        setTaskFormError(payload?.error || 'Erreur lors de la création de la tâche.');
        return;
      }
      await fetchProjet();
      setTaskForm({ libelle: '', description: '', priorite: 'Critique', assigneAId: '', dateDebutPrevisionnelle: '', dateFinPrevisionnelle: '' });
      setShowTaskForm(false);
    } catch {
      setTaskFormError('Erreur réseau.');
    }
  };

  const fetchSousTaches = async (taskId: string) => {
    setStLoading(true);
    try {
      const res = await fetch(`/api/taches/${taskId}/sous-taches`);
      const data = await res.json();
      setSousTaches(Array.isArray(data) ? data : []);
    } catch { /* silently */ }
    finally { setStLoading(false); }
  };

  const handleStToggle = async (st: { id: string; estFaite: boolean }) => {
    if (!selectedTaskId) return;
    // Optimistic
    setSousTaches(prev => prev.map(s => s.id === st.id ? { ...s, estFaite: !s.estFaite } : s));
    await fetch(`/api/taches/${selectedTaskId}/sous-taches/${st.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estFaite: !st.estFaite }),
    });
  };

  const handleStAdd = async () => {
    if (!selectedTaskId || !stNewLibelle.trim()) return;
    setStAdding(true);
    try {
      const res = await fetch(`/api/taches/${selectedTaskId}/sous-taches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ libelle: stNewLibelle.trim() }),
      });
      if (res.ok) {
        setStNewLibelle('');
        await fetchSousTaches(selectedTaskId);
      }
    } catch { /* silently */ }
    finally { setStAdding(false); }
  };

  const handleStDelete = async (stId: string) => {
    if (!selectedTaskId) return;
    setSousTaches(prev => prev.filter(s => s.id !== stId));
    await fetch(`/api/taches/${selectedTaskId}/sous-taches/${stId}`, { method: 'DELETE' });
  };

  const handleStEditSave = async () => {
    if (!selectedTaskId || !stEditId || !stEditLibelle.trim()) return;
    setSousTaches(prev => prev.map(s => s.id === stEditId ? { ...s, libelle: stEditLibelle.trim() } : s));
    await fetch(`/api/taches/${selectedTaskId}/sous-taches/${stEditId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ libelle: stEditLibelle.trim() }),
    });
    setStEditId(null);
    setStEditLibelle('');
  };

  const openDetail = (task: Tache) => {
    setSelectedTaskId(task.id);
    syncDetailEdit(task);
    setDetailError('');
    setCommentaireText('');
    setReplyingTo(null);
    setReplyText('');
    setCommentaires([]);
    setActivites([]);
    setSousTaches([]);
    setStNewLibelle('');
    setStEditId(null);
    setActiveTab('detail');
    fetchCommentaires(task.id);
    fetchActivites(task.id);
    fetchSousTaches(task.id);
  };

  const handleDetailSave = async () => {
    if (!selectedTaskId) return;
    setDetailSaving(true);
    setDetailError('');
    try {
      const res = await fetch(`/api/taches/${selectedTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          libelle: detailEdit.libelle,
          description: detailEdit.description,
          priorite: detailEdit.priorite,
          statut: detailEdit.statut,
          assigneAId: detailEdit.assigneAId || null,
          dateDebutPrevisionnelle: detailEdit.dateDebutPrevisionnelle || null,
          dateFinPrevisionnelle: detailEdit.dateFinPrevisionnelle || null,
          // dateDebutEffective et dateFinEffective gérées automatiquement par le serveur
        }),
      });
      if (!res.ok) {
        const payload = await res.json();
        setDetailError(payload?.error || 'Erreur lors de la mise à jour.');
        return;
      }
      await fetchProjet();
    } catch {
      setDetailError('Erreur réseau.');
    } finally {
      setDetailSaving(false);
    }
  };

  const submitComment = async (contenu: string, parentId?: string | null) => {
    if (!selectedTaskId || !contenu.trim()) return;
    setCommentSubmitting(true);
    try {
      await fetch(`/api/taches/${selectedTaskId}/commentaires`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu: contenu.trim(), parentId: parentId ?? null }),
      });
      await fetchCommentaires(selectedTaskId);
      if (parentId) { setReplyingTo(null); setReplyText(''); }
      else setCommentaireText('');
    } catch {
      // silently ignore
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTaskId) return;
    setDeleteTaskLoading(true);
    setDeleteTaskError('');
    try {
      const res = await fetch(`/api/taches/${selectedTaskId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { setDeleteTaskError(data?.error || 'Erreur lors de la suppression.'); return; }
      setDeleteTaskConfirm(false);
      setSelectedTaskId(null);
      setDetailEdit({});
      await fetchProjet();
    } catch { setDeleteTaskError('Erreur réseau.'); }
    finally { setDeleteTaskLoading(false); }
  };

  const handleEditComment = async (commentaireId: string) => {
    if (!selectedTaskId || !editCommentText.trim()) return;
    setEditCommentSaving(true);
    try {
      const res = await fetch(`/api/taches/${selectedTaskId}/commentaires/${commentaireId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu: editCommentText.trim() }),
      });
      if (res.ok) {
        setEditingCommentId(null);
        setEditCommentText('');
        await fetchCommentaires(selectedTaskId);
      }
    } catch { /* silently ignore */ }
    finally { setEditCommentSaving(false); }
  };

  const handleDeleteComment = async (commentaireId: string) => {
    if (!selectedTaskId) return;
    setDeleteCommentLoading(true);
    try {
      const res = await fetch(`/api/taches/${selectedTaskId}/commentaires/${commentaireId}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteCommentId(null);
        await fetchCommentaires(selectedTaskId);
      }
    } catch { /* silently ignore */ }
    finally { setDeleteCommentLoading(false); }
  };

  const moveTask = async (taskId: string, newStatut: string) => {
    // Bloquer le déplacement vers "Validé" pour les non-GESTIONNAIRE
    if (newStatut === 'Validé' && !canValider) return;
    const task = projet?.taches.find(t => t.id === taskId);
    if (task && !getAllowedNextStatuts(task).includes(newStatut)) return;
    setMovingTaskId(taskId);
    setPendingMoveCol(newStatut);
    try {
      await fetch(`/api/taches/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut }),
      });
      await fetchProjet();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setMovingTaskId(null);
      setPendingMoveCol(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Chargement...</div>;
  if (!projet) return <div className="text-center py-16 text-slate-400">Projet non trouvé</div>;

  const taches = projet.taches ?? [];
  const totalTaches = taches.length;

  const tauxAvancReel    = Math.round(projet.tauxAvancementReel    ?? 0);
  const tauxAvancAttendu = Math.round(projet.tauxAvancementAttendu ?? 0);
  const tauxAchevReel    = Math.round(projet.tauxAchevementReel    ?? 0);
  const tauxAchevAttendu = Math.round(projet.tauxAchevementAttendu ?? 0);

  const etatAv  = projet.etatAvancement ?? getAvanancementProjet(projet) ?? null;
  const avBadge = etatAv ? (AVANCEMENT_BADGE[etatAv] ?? null) : null;

  const risqueGlobal = projet.risques?.find(r => r.libelle === 'global') ?? null;
  const risqueConfig = risqueGlobal ? (RISQUE_CONFIG[risqueGlobal.gravite] ?? null) : null;

  const entiteMap = new Map<string, Entite>();
  projet.equipeProjet.forEach(m => { if (m.entite?.id) entiteMap.set(m.entite.id, m.entite); });
  const entites = Array.from(entiteMap.values());

  const tasksByMember = (memberId: string) => taches.filter(t => t.assigneA?.id === memberId);
  const tasksByColumn = (col: string) => taches.filter(t => {
    if (movingTaskId === t.id) return col === pendingMoveCol;
    return t.statut === col;
  });

  // Peut valider (déplacer vers "Validé") : GESTIONNAIRE+
  const ROLES_VALIDEUR = ['GESTIONNAIRE', 'COORDINATEUR', 'ADMINISTRATEUR'];
  const canValider = session?.estSuperAdmin || (session !== null && ROLES_VALIDEUR.includes(session.role));

  const selectedTask = selectedTaskId ? taches.find(t => t.id === selectedTaskId) ?? null : null;
  const selectedAvancement = selectedTask ? getAvancement(selectedTask) : null;
  const projFinPrev = projet.dateFinPrevisionnelle ? toInputDate(projet.dateFinPrevisionnelle) : '';

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'infos',        label: 'Informations générales' },
    { key: 'dashboard',    label: 'Dashboard' },
    { key: 'liste-taches', label: 'Liste des tâches' },
    { key: 'execution',    label: 'Exécution' },
    { key: 'gantt',        label: 'Gantt' },
    { key: 'detail',       label: 'Détail tâche' },
  ];

  return (
    <div className="space-y-6">

      {/* ── HEADER ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* Infos projet */}
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-primary">{projet.libelle}</h1>
            {projet.entitePorteuse && (
              <p className="mt-1 flex items-center gap-1.5 text-slate-500 text-sm font-medium">
                <Building2 size={13} className="flex-shrink-0" />
                {projet.entitePorteuse.typeEntite ? `[${projet.entitePorteuse.typeEntite}] ` : ''}{projet.entitePorteuse.libelle}
              </p>
            )}
            {projet.description && (
              <p className="mt-1 text-slate-500 text-sm">{projet.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3">
              <span className="px-3 py-1 rounded-full text-sm font-semibold" style={getProjetStatutStyle(projet.statut)}>
                {projet.statut}
              </span>
              {avBadge && (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${avBadge.classes}`}>
                  {avBadge.label}
                </span>
              )}
              <span className="flex items-center gap-1 text-slate-600 text-sm">
                <Users size={14} />
                {projet.equipeProjet.length} membre{projet.equipeProjet.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1 text-slate-600 text-sm">
                <CheckCircle2 size={14} />
                {totalTaches} tâche{totalTaches !== 1 ? 's' : ''}
              </span>
              {/* Dates — même ligne, séparées par un tiret */}
              {(projet.dateDebutPrevisionnelle || projet.dateFinPrevisionnelle || projet.dateDebutEffective || projet.dateFinEffective) && (
                <>
                  <span className="text-slate-300 select-none">|</span>
                  {projet.dateDebutPrevisionnelle && (
                    <span className="text-xs text-slate-400">Début prév. {fmtDate(projet.dateDebutPrevisionnelle)}</span>
                  )}
                  {projet.dateFinPrevisionnelle && (
                    <span className="text-xs text-slate-400">Fin prév. {fmtDate(projet.dateFinPrevisionnelle)}</span>
                  )}
                  {projet.dateDebutEffective && (
                    <span className="text-xs text-emerald-600 font-medium">Début eff. {fmtDate(projet.dateDebutEffective)}</span>
                  )}
                  {projet.dateFinEffective && (
                    <span className="text-xs text-emerald-600 font-medium">Fin eff. {fmtDate(projet.dateFinEffective)}</span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Risque global — extrême droite */}
          {risqueGlobal && risqueConfig && (
            <div className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-xl ${risqueConfig.classes} bg-opacity-80`}>
              <risqueConfig.Icon size={22} />
              <span className="text-lg font-bold leading-none">{risqueGlobal.taux}%</span>
              <span className="text-xs font-medium leading-none">Risque {risqueConfig.label}</span>
            </div>
          )}
        </div>

        {/* Métriques — 4 barres sur une ligne */}
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
          {/* Progression attendue */}
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Progression attendue</span>
              <span className="font-bold text-blue-600">{tauxAvancAttendu}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${tauxAvancAttendu}%` }} />
            </div>
          </div>
          {/* Progression réelle */}
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Progression réelle</span>
              <span className="font-bold text-emerald-600">{tauxAvancReel}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${tauxAvancReel}%` }} />
            </div>
          </div>
          {/* Réalisation attendue */}
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Réalisation attendue</span>
              <span className="font-bold text-indigo-600">{tauxAchevAttendu}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${tauxAchevAttendu}%` }} />
            </div>
          </div>
          {/* Réalisation réelle */}
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Réalisation réelle</span>
              <span className="font-bold text-violet-600">{tauxAchevReel}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${tauxAchevReel}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1" role="tablist">
          {TABS.map(tab => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── TAB: INFORMATIONS GÉNÉRALES ── */}
      {activeTab === 'infos' && (
        <div className="space-y-6">
          {/* Formulaire d'édition des informations générales du projet */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-base font-bold text-primary mb-4">Informations générales du projet</h2>
            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              onSubmit={async e => {
                e.preventDefault();
                setDetailSaving(true);
                setDetailError('');
                try {
                  const res = await fetch(`/api/projets/${projectId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      libelle: detailEdit.libelle,
                      description: detailEdit.description,
                      statut: detailEdit.statut,
                      chefProjetId: detailEdit.chefProjetId,
                      entiteId: detailEdit.entiteId !== undefined ? (detailEdit.entiteId || null) : undefined,
                      dateDebutPrevisionnelle: detailEdit.dateDebutPrevisionnelle ?? toInputDate(projet.dateDebutPrevisionnelle),
                      dateFinPrevisionnelle: detailEdit.dateFinPrevisionnelle ?? toInputDate(projet.dateFinPrevisionnelle),
                      dateDebutEffective: detailEdit.dateDebutEffective ?? toInputDate(projet.dateDebutEffective),
                      dateFinEffective: detailEdit.dateFinEffective ?? toInputDate(projet.dateFinEffective),
                    }),
                  });
                  if (!res.ok) {
                    const payload = await res.json();
                    setDetailError(payload?.error || 'Erreur lors de la mise à jour.');
                    return;
                  }
                  await fetchProjet();
                } catch {
                  setDetailError('Erreur réseau.');
                } finally {
                  setDetailSaving(false);
                }
              }}
            >
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Libellé <span className="text-red-500">*</span></label>
                <textarea
                  required
                  value={detailEdit.libelle ?? projet.libelle}
                  onChange={e => setDetailEdit((d: any) => ({ ...d, libelle: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea
                  value={detailEdit.description ?? projet.description ?? ''}
                  onChange={e => setDetailEdit((d: any) => ({ ...d, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Statut <span className="text-red-500">*</span></label>
                <select
                  required
                  value={detailEdit.statut ?? projet.statut}
                  onChange={e => setDetailEdit((d: any) => ({ ...d, statut: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  {STATUTS_PROJET.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Chef de projet <span className="text-red-500">*</span></label>
                <select
                  required
                  value={detailEdit.chefProjetId ?? projet.chefProjet?.id ?? ''}
                  onChange={e => setDetailEdit((d: any) => ({ ...d, chefProjetId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">— Sélectionner —</option>
                  {ressources.map(m => (
                    <option key={m.id} value={m.id}>{m.prenoms} {m.nom} ({m.fonction})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Entité porteuse (Owner)</label>
                <select
                  value={detailEdit.entiteId ?? projet.entitePorteuse?.id ?? ''}
                  onChange={e => setDetailEdit((d: any) => ({ ...d, entiteId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">— Aucune —</option>
                  {toutesEntites.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.typeEntite ? `[${e.typeEntite}] ` : ''}{e.libelle}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Début prévisionnel</label>
                <input
                  type="date"
                  readOnly={!session?.estSuperAdmin}
                  value={detailEdit.dateDebutPrevisionnelle ?? toInputDate(projet.dateDebutPrevisionnelle)}
                  onChange={e => session?.estSuperAdmin && setDetailEdit((d: any) => ({ ...d, dateDebutPrevisionnelle: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${session?.estSuperAdmin ? 'border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30' : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Fin prévisionnelle</label>
                <input
                  type="date"
                  readOnly={!session?.estSuperAdmin}
                  value={detailEdit.dateFinPrevisionnelle ?? toInputDate(projet.dateFinPrevisionnelle)}
                  onChange={e => session?.estSuperAdmin && setDetailEdit((d: any) => ({ ...d, dateFinPrevisionnelle: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${session?.estSuperAdmin ? 'border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30' : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Début effectif</label>
                <input
                  type="date"
                  readOnly
                  value={toInputDate(projet.dateDebutEffective)}
                  className="w-full px-3 py-2 border border-slate-100 rounded-lg text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Fin effective</label>
                <input
                  type="date"
                  readOnly
                  value={toInputDate(projet.dateFinEffective)}
                  className="w-full px-3 py-2 border border-slate-100 rounded-lg text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                />
              </div>
              <div className="md:col-span-2">
                {detailError && <p className="text-xs text-red-600 mb-2">{detailError}</p>}
                <button
                  type="submit"
                  disabled={detailSaving}
                  className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold"
                >
                  {detailSaving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </section>



          {/* Entités */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
              <Building2 size={17} /> Entités impliquées
            </h2>
            {entites.length === 0 ? (
              <p className="text-slate-400 text-sm">Aucune entité</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {entites.map(e => (
                  <span key={e.id} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                    {e.libelle}
                    {e.tutelle && <span className="text-slate-400 ml-1 font-normal">· {e.tutelle}</span>}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Équipe et tâches */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-primary flex items-center gap-2">
                <Users size={17} /> Membres de l&apos;équipe
              </h2>
              <button
                title="Ajouter un membre"
                className="ml-2 p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600"
                onClick={() => setShowAddEquipe(v => !v)}
                type="button"
              >
                <Plus size={18} />
              </button>
              {showAddEquipe && (
                <div className="absolute z-20 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg p-4 min-w-[260px] max-h-80 overflow-y-auto">
                  <h3 className="font-semibold text-sm mb-2">Ajouter des membres</h3>
                  <ul className="space-y-1">
                    {ressources.filter(r => !projet.equipeProjet.some(m => m.id === r.id)).map(r => (
                      <li key={r.id} className="flex items-center gap-2">
                        <span className="flex-1 truncate">{r.prenoms} {r.nom} <span className="text-xs text-slate-400">({r.fonction})</span></span>
                        <button
                          className="p-1 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600"
                          disabled={addingEquipeIds.includes(r.id)}
                          onClick={async () => {
                            setAddingEquipeIds(ids => [...ids, r.id]);
                            await fetch(`/api/projets/${projectId}/equipe`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ membreId: r.id }),
                            });
                            setAddingEquipeIds(ids => ids.filter(id => id !== r.id));
                            await fetchProjet();
                          }}
                          type="button"
                        >
                          <Plus size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button className="mt-3 text-xs text-slate-400 hover:text-slate-600" onClick={() => setShowAddEquipe(false)} type="button">Fermer</button>
                </div>
              )}
            </div>
            {projet.equipeProjet.length === 0 ? (
              <p className="text-slate-400 text-sm">Aucun membre</p>
            ) : (
              <div className="flex flex-wrap gap-4">
                {projet.equipeProjet.map(membre => {
                  const memberTasks = tasksByMember(membre.id);
                  const isChef = projet.chefProjet?.id === membre.id;
                  return (
                    <div key={membre.id} className="border border-slate-100 rounded-xl p-4 flex flex-col w-[270px] relative">
                      <button
                        title="Retirer le membre"
                        className="absolute top-2 right-2 p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-600"
                        onClick={() => setRemovingMembreId(membre.id)}
                        type="button"
                        disabled={removingMembreLoading}
                      >
                        <span className="sr-only">Retirer</span>
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 12h14"/></svg>
                      </button>
                                {/* Modal de confirmation retrait membre */}
                                {removingMembreId && (() => {
                                  const membre = projet.equipeProjet.find(m => m.id === removingMembreId);
                                  if (!membre) return null;
                                  return (
                                    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30">
                                      <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
                                        <h3 className="font-bold text-lg mb-2">Retirer ce membre ?</h3>
                                        <p className="text-sm text-slate-600 mb-4">Retirer ce membre de l'équipe projet va le désassigner de ses tâches. Ces tâches passeront en attente. Voulez-vous le retirer ?</p>
                                        <div className="flex justify-end gap-2">
                                          <button
                                            className="px-4 py-1.5 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 text-slate-600"
                                            onClick={() => setRemovingMembreId(null)}
                                            type="button"
                                            disabled={removingMembreLoading}
                                          >Non</button>
                                          <button
                                            className="px-4 py-1.5 rounded-lg text-sm bg-red-600 hover:bg-red-700 text-white font-semibold"
                                            disabled={removingMembreLoading}
                                            onClick={async () => {
                                              setRemovingMembreLoading(true);
                                              // Désassigner les tâches du membre
                                              const memberTasks = taches.filter(t => t.assigneA?.id === membre.id);
                                              for (const t of memberTasks) {
                                                await fetch(`/api/taches/${t.id}`, {
                                                  method: 'PUT',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({ assigneAId: null, statut: 'En attente' }),
                                                });
                                              }
                                              // Retirer le membre de l'équipe
                                              await fetch(`/api/projets/${projectId}/equipe`, {
                                                method: 'DELETE',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ membreId: membre.id }),
                                              });
                                              setRemovingMembreId(null);
                                              setRemovingMembreLoading(false);
                                              await fetchProjet();
                                            }}
                                            type="button"
                                          >Oui, retirer</button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-9 w-9 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-semibold text-sm shrink-0">
                          {membre.prenoms?.[0]}{membre.nom?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm flex items-center gap-1">
                            {membre.prenoms} {membre.nom}
                            {isChef && (
                              <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">Chef de projet</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">{membre.fonction}{membre.entite ? ` · ${membre.entite.libelle}` : ''}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-1"><span className="font-semibold">Email :</span> {membre.email}</p>
                      {membre.telephone && <p className="text-xs text-slate-500 mb-1"><span className="font-semibold">Tél :</span> {membre.telephone}</p>}
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full mb-2 w-fit">
                        {memberTasks.length} tâche{memberTasks.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Registre parties prenantes */}
          <RegistrePartiesPrenantes
            projetId={projectId}
            partiesPrenantes={projet.partiesPrenantes}
            ressources={ressources}
            onRefresh={fetchProjet}
          />

          {/* Opération induite — visible uniquement si projet Terminé ou Clôturé */}
          {(projet.statut === 'Terminé' || projet.statut === 'Clôturé') && (
            <section className="bg-white rounded-2xl shadow-sm border border-secondary/30 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-secondary mb-1">Opérations induites</h2>
                  <p className="text-sm text-slate-500">Ce projet est terminé. Vous pouvez créer une opération permanente induite par ce projet (ex : maintenance, suivi récurrent).</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOpInduiteForm({ libelle: `Opération — ${projet.libelle}`, description: '', dateDebut: new Date().toISOString().slice(0, 10), entiteId: projet.entitePorteuse?.id ?? '', responsableId: projet.chefProjet?.id ?? '' });
                    setShowOperationInduite(true);
                  }}
                  className="flex-shrink-0 flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  <Plus size={14} /> Créer une opération induite
                </button>
              </div>

              {showOperationInduite && (
                <form
                  className="mt-4 border-t border-slate-100 pt-4 space-y-3"
                  onSubmit={async e => {
                    e.preventDefault();
                    setOpInduiteError('');
                    if (!opInduiteForm.entiteId && !opInduiteForm.responsableId) {
                      setOpInduiteError('Une entité ou un responsable est obligatoire.');
                      return;
                    }
                    setOpInduiteSaving(true);
                    try {
                      const res = await fetch('/api/operations', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          libelle:        opInduiteForm.libelle,
                          description:    opInduiteForm.description || null,
                          statut:         'Active',
                          entiteId:       opInduiteForm.entiteId      || null,
                          responsableId:  opInduiteForm.responsableId || null,
                          projetSourceId: projet.id,
                          dateDebut:      opInduiteForm.dateDebut,
                        }),
                      });
                      if (!res.ok) {
                        const d = await res.json();
                        setOpInduiteError(d?.error || 'Erreur lors de la création.');
                      } else {
                        const op = await res.json();
                        setShowOperationInduite(false);
                        router.push(`/operations/${op.id}`);
                      }
                    } finally { setOpInduiteSaving(false); }
                  }}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Libellé *</label>
                      <input required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        value={opInduiteForm.libelle} onChange={e => setOpInduiteForm({ ...opInduiteForm, libelle: e.target.value })} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                      <textarea rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        value={opInduiteForm.description} onChange={e => setOpInduiteForm({ ...opInduiteForm, description: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Entité responsable</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        value={opInduiteForm.entiteId} onChange={e => setOpInduiteForm({ ...opInduiteForm, entiteId: e.target.value })}>
                        <option value="">— Aucune —</option>
                        {toutesEntites.map(en => <option key={en.id} value={en.id}>{en.typeEntite ? `[${en.typeEntite}] ` : ''}{en.libelle}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Responsable direct</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        value={opInduiteForm.responsableId} onChange={e => setOpInduiteForm({ ...opInduiteForm, responsableId: e.target.value })}>
                        <option value="">— Aucun —</option>
                        {ressources.map(p => <option key={p.id} value={p.id}>{p.nom} {p.prenoms}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Date de début *</label>
                      <input required type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        value={opInduiteForm.dateDebut} onChange={e => setOpInduiteForm({ ...opInduiteForm, dateDebut: e.target.value })} />
                    </div>
                  </div>
                  {opInduiteError && <p className="text-sm text-red-600">{opInduiteError}</p>}
                  <div className="flex gap-2">
                    <button type="submit" disabled={opInduiteSaving}
                      className="bg-secondary text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                      {opInduiteSaving ? 'Création…' : 'Créer et ouvrir'}
                    </button>
                    <button type="button" onClick={() => setShowOperationInduite(false)}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">Annuler</button>
                  </div>
                </form>
              )}
            </section>
          )}

          {/* Zone dangereuse */}
          <section className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
            <h2 className="text-base font-bold text-red-600 mb-1">Zone dangereuse</h2>
            <p className="text-sm text-slate-500 mb-4">
              La suppression du projet est irréversible. Toutes les tâches, commentaires et historiques associés seront définitivement supprimés.
            </p>
            <button
              type="button"
              onClick={() => { setShowDeleteConfirm(true); setDeleteError(''); }}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-semibold"
            >
              <Trash2 size={15} />
              Supprimer ce projet
            </button>
          </section>

          {/* Modale de confirmation suppression */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
                <h3 className="font-bold text-lg text-slate-800 mb-2">Supprimer ce projet ?</h3>
                <p className="text-sm text-slate-600 mb-2">
                  Vous êtes sur le point de supprimer définitivement le projet :
                </p>
                <p className="text-sm font-semibold text-slate-800 bg-slate-50 rounded-lg px-3 py-2 mb-4 border border-slate-100">
                  {projet.libelle}
                </p>
                <p className="text-sm text-slate-500 mb-5">
                  Cette action supprimera également toutes les tâches ({taches.length}), commentaires et l&apos;historique d&apos;activité. Elle est <span className="font-semibold text-red-600">irréversible</span>.
                </p>
                {deleteError && <p className="text-xs text-red-600 mb-3">{deleteError}</p>}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleteLoading}
                    className="px-4 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={deleteLoading}
                    onClick={async () => {
                      setDeleteLoading(true);
                      setDeleteError('');
                      try {
                        const res = await fetch(`/api/projets/${projectId}`, { method: 'DELETE' });
                        if (!res.ok) {
                          const payload = await res.json();
                          setDeleteError(payload?.error || 'Erreur lors de la suppression.');
                          setDeleteLoading(false);
                          return;
                        }
                        router.push('/projets');
                      } catch {
                        setDeleteError('Erreur réseau.');
                        setDeleteLoading(false);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold"
                  >
                    <Trash2 size={14} />
                    {deleteLoading ? 'Suppression…' : 'Oui, supprimer'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: LISTE DES TÂCHES ── */}
      {activeTab === 'liste-taches' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary">Liste des tâches</h2>
            <button
              onClick={() => { setShowTaskForm(v => !v); setTaskFormError(''); }}
              className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              {showTaskForm ? <X size={15} /> : <Plus size={15} />}
              {showTaskForm ? 'Annuler' : 'Nouvelle tâche'}
            </button>
          </div>

          {showTaskForm && (
            <form onSubmit={handleTaskSubmit} className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold text-slate-700 text-sm">Créer une tâche</h3>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Libellé <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={taskForm.libelle}
                  onChange={e => setTaskForm(f => ({ ...f, libelle: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Priorité <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={taskForm.priorite}
                    onChange={e => setTaskForm(f => ({ ...f, priorite: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option>Bloquant</option>
                    <option>Critique</option>
                    <option>Normal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Assigner à <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={taskForm.assigneAId}
                    onChange={e => setTaskForm(f => ({ ...f, assigneAId: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="">— Sélectionner une personne —</option>
                    {ressources.map(m => (
                      <option key={m.id} value={m.id}>{m.prenoms} {m.nom} ({m.fonction})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Début prévisionnel <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={taskForm.dateDebutPrevisionnelle}
                    max={projFinPrev || undefined}
                    onChange={e => setTaskForm(f => ({ ...f, dateDebutPrevisionnelle: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fin prévisionnelle <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={taskForm.dateFinPrevisionnelle}
                    min={taskForm.dateDebutPrevisionnelle || undefined}
                    max={projFinPrev || undefined}
                    onChange={e => setTaskForm(f => ({ ...f, dateFinPrevisionnelle: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              {projFinPrev && (
                <p className="text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-lg">
                  La fin prévisionnelle ne peut pas dépasser le <strong>{fmtDate(projet.dateFinPrevisionnelle)}</strong>.
                </p>
              )}

              {taskFormError && <p className="text-xs text-red-600">{taskFormError}</p>}

              <button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-semibold"
              >
                Créer la tâche
              </button>
            </form>
          )}

          {/* ── Barre de filtres ── */}
          {taches.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Recherche tâche */}
                <div className="relative">
                  <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une tâche…"
                    value={flTache}
                    onChange={e => setFlTache(e.target.value)}
                    className="pl-6 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 w-44"
                  />
                </div>
                {/* Assigné à */}
                <MultiSelect
                  label="Assigné à"
                  options={[...new Set(taches.map(t => t.assigneA ? `${t.assigneA.prenoms} ${t.assigneA.nom}` : '—'))]}
                  selected={flAssigne}
                  onChange={setFlAssigne}
                />
                {/* Priorité */}
                <MultiSelect
                  label="Priorité"
                  options={['Bloquant', 'Critique', 'Normal']}
                  selected={flPriorite}
                  onChange={setFlPriorite}
                />
                {/* Statut */}
                <MultiSelect
                  label="Statut"
                  options={['À planifier', 'A faire', 'En cours', 'En attente', 'Terminé', 'Validé']}
                  selected={flStatut}
                  onChange={setFlStatut}
                />
                {/* Avancement */}
                <MultiSelect
                  label="Avancement"
                  options={["En avance", "À l'heure", "En retard", "Hors délai"]}
                  selected={flAvancement}
                  onChange={setFlAvancement}
                />
                {/* Période */}
                <span className="text-xs text-slate-400">Période :</span>
                <input
                  type="date"
                  value={flPeriodeDebut}
                  onChange={e => setFlPeriodeDebut(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <span className="text-xs text-slate-400">→</span>
                <input
                  type="date"
                  value={flPeriodeFin}
                  min={flPeriodeDebut || undefined}
                  onChange={e => setFlPeriodeFin(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                {/* Reset global */}
                {(flTache || flAssigne.length || flPriorite.length || flStatut.length || flAvancement.length || flPeriodeDebut || flPeriodeFin) && (
                  <button
                    type="button"
                    onClick={() => { setFlTache(''); setFlAssigne([]); setFlPriorite([]); setFlStatut([]); setFlAvancement([]); setFlPeriodeDebut(''); setFlPeriodeFin(''); }}
                    className="text-xs text-slate-400 hover:text-red-500 underline ml-1"
                  >
                    Tout réinitialiser
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tableau des tâches */}
          {(() => {
            const tachesFiltrees = taches.filter(t => {
              if (flTache && !t.libelle.toLowerCase().includes(flTache.toLowerCase())) return false;
              const nomAssigne = t.assigneA ? `${t.assigneA.prenoms} ${t.assigneA.nom}` : '—';
              if (flAssigne.length && !flAssigne.includes(nomAssigne)) return false;
              if (flPriorite.length && !flPriorite.includes(normalizePriority(t.priorite))) return false;
              if (flStatut.length && !flStatut.includes(t.statut)) return false;
              if (flAvancement.length) {
                const av = getAvancement(t);
                const avLabel = t.statut === 'À planifier' ? null : (AVANCEMENT_BADGE[av]?.label ?? null);
                if (!avLabel || !flAvancement.includes(avLabel)) return false;
              }
              if (flPeriodeDebut && t.dateFinPrevisionnelle && t.dateFinPrevisionnelle < flPeriodeDebut) return false;
              if (flPeriodeFin && t.dateDebutPrevisionnelle && t.dateDebutPrevisionnelle > flPeriodeFin) return false;
              return true;
            });
            return (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {taches.length === 0 ? (
                  <div className="py-14 text-center text-slate-400 text-sm">
                    Aucune tâche créée. Cliquez sur &quot;Nouvelle tâche&quot; pour commencer.
                  </div>
                ) : tachesFiltrees.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-sm">Aucune tâche ne correspond aux filtres.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                          <th className="text-left py-3 px-4 font-semibold">Tâche</th>
                          <th className="text-left py-3 px-4 font-semibold">Assignée à</th>
                          <th className="text-left py-3 px-4 font-semibold">Priorité</th>
                          <th className="text-left py-3 px-4 font-semibold">Statut d&apos;exécution</th>
                          <th className="text-left py-3 px-4 font-semibold">Avancement</th>
                          <th className="text-left py-3 px-4 font-semibold">Dates prév.</th>
                          <th className="text-left py-3 px-4 font-semibold">Dates effect.</th>
                          <th className="py-3 px-4 font-semibold text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {tachesFiltrees.map(t => {
                          const av = getAvancement(t);
                          const avBadgeTask = t.statut !== 'À planifier' ? AVANCEMENT_BADGE[av] : null;
                          return (
                            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4">
                                <p className="font-medium text-slate-800">{t.libelle}</p>
                              </td>
                              <td className="py-3 px-4 text-slate-600 text-xs">
                                {t.assigneA ? `${t.assigneA.prenoms} ${t.assigneA.nom}` : <span className="text-slate-300">—</span>}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITE_COLORS[normalizePriority(t.priorite)] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                  {normalizePriority(t.priorite)}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUT_COLORS[t.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                                  {t.statut}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {avBadgeTask
                                  ? <span className={`text-xs px-2 py-0.5 rounded-full ${avBadgeTask.classes}`}>{avBadgeTask.label}</span>
                                  : <span className="text-slate-300 text-xs">—</span>}
                              </td>
                              <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">
                                <div>{fmtDate(t.dateDebutPrevisionnelle)}</div>
                                <div className="text-slate-400">{fmtDate(t.dateFinPrevisionnelle)}</div>
                              </td>
                              <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">
                                <div>{fmtDate(t.dateDebutEffective)}</div>
                                <div className="text-slate-400">{fmtDate(t.dateFinEffective)}</div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  title="Voir le détail de la tâche"
                                  onClick={() => openDetail(t)}
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-secondary/10 hover:bg-secondary/20 text-secondary transition-colors"
                                >
                                  <Plus size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── TAB: EXÉCUTION (KANBAN) ── */}
      {activeTab === 'execution' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-primary">Tableau d&apos;exécution</h2>
          <p className="text-xs text-slate-400">Glissez-déposez les tickets pour changer leur statut.</p>
          <div className="overflow-x-auto pb-4">
            <div className="grid min-w-[1220px] grid-cols-5 gap-4">
              {KANBAN_COLUMNS.map(col => {
                const cfg = KANBAN_CONFIG[col];
                const tasks = tasksByColumn(col);
                const isOver = dropTargetCol === col;
                // La colonne "Validé" est visible mais les drops y sont bloqués pour les non-GESTIONNAIRE
                const isValidéCol = col === 'Validé';
                const dropLocked = isValidéCol && !canValider;
                return (
                  <div
                    key={col}
                    className={`min-w-0 bg-white rounded-2xl border border-slate-200 border-t-4 ${cfg.borderColor} shadow-sm flex flex-col ${dropLocked ? 'opacity-90' : ''}`}
                    onDragOver={e => {
                      if (dropLocked) return; // bloquer le drop
                      e.preventDefault();
                      setDropTargetCol(col);
                    }}
                    onDragLeave={e => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTargetCol(null);
                    }}
                    onDrop={e => {
                      if (dropLocked) return; // bloquer le drop
                      e.preventDefault();
                      if (draggedTaskId) moveTask(draggedTaskId, col);
                      setDraggedTaskId(null);
                      setDropTargetCol(null);
                    }}
                  >
                    <div className={`px-4 py-3 rounded-t-xl flex items-center justify-between ${cfg.headerClass}`}>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-sm">{cfg.label}</h3>
                        {dropLocked && (
                          <Lock size={11} className="opacity-60" aria-label="Validation réservée aux Gestionnaires et Coordinateurs" />
                        )}
                      </div>
                      <span className="text-xs font-bold bg-white/60 px-2 py-0.5 rounded-full">{tasks.length}</span>
                    </div>
                    <div
                      className={`p-2.5 space-y-2 min-h-[180px] flex-1 rounded-b-2xl transition-colors ${
                        isOver ? 'bg-slate-50 ring-2 ring-inset ring-slate-300' : ''
                      }`}
                    >
                      {tasks.map(task => {
                        const avancement = getAvancement(task);
                        const priorityBg = PRIORITE_CARD_BG[normalizePriority(task.priorite)] ?? 'bg-slate-50';
                        const avancementBorder = AVANCEMENT_BORDER_LEFT[avancement];
                        return (
                          <div
                            key={task.id}
                            draggable={movingTaskId === null}
                            onDragStart={() => setDraggedTaskId(task.id)}
                            onDragEnd={() => { setDraggedTaskId(null); setDropTargetCol(null); }}
                            className={`relative rounded-xl p-3 border-l-4 shadow-sm select-none transition-opacity ${
                              priorityBg
                            } ${
                              avancementBorder
                            } ${
                              movingTaskId === task.id
                                ? 'opacity-70 cursor-wait'
                                : draggedTaskId === task.id
                                ? 'opacity-30 cursor-grab'
                                : 'opacity-100 cursor-grab active:cursor-grabbing'
                            }`}
                          >
                            {movingTaskId === task.id && (
                              <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-white/50 z-10">
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                            <p className="font-semibold text-slate-800 text-sm leading-snug">{task.libelle}</p>
                            {task.assigneA && (
                              <p className="text-xs text-slate-500 mt-1.5 truncate">
                                {task.assigneA.prenoms} {task.assigneA.nom}
                              </p>
                            )}
                          </div>
                        );
                      })}
                      {tasks.length === 0 && (
                        <div
                          className={`flex items-center justify-center h-20 text-xs rounded-xl border-2 border-dashed transition-colors ${
                            isOver ? 'border-slate-400 text-slate-400' : 'border-slate-100 text-slate-300'
                          }`}
                        >
                          {isOver ? 'Déposer ici' : 'Aucune tâche'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: GANTT ── */}
      {activeTab === 'gantt' && (
        <ProjectGantt tasks={taches} title="Diagramme de Gantt des tâches" />
      )}

      {/* ── TAB: DASHBOARD ── */}
      {activeTab === 'dashboard' && (
        <ReportingTab projet={projet} />
      )}

      {/* ── TAB: DÉTAIL TÂCHE ── */}
      {activeTab === 'detail' && (
        <div className="space-y-5">
          {/* En-tête : titre à gauche, filtres + sélecteur à droite */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-4 py-3">
            {(() => {
              const tachesDt = taches.filter(t => {
                const nomAssigne = t.assigneA ? `${t.assigneA.prenoms} ${t.assigneA.nom}` : '—';
                if (dtAssigne.length && !dtAssigne.includes(nomAssigne)) return false;
                if (dtPriorite.length && !dtPriorite.includes(normalizePriority(t.priorite))) return false;
                if (dtStatut.length && !dtStatut.includes(t.statut)) return false;
                if (dtAvancement.length) {
                  const av = getAvancement(t);
                  const avLabel = t.statut === 'À planifier' ? null : (AVANCEMENT_BADGE[av]?.label ?? null);
                  if (!avLabel || !dtAvancement.includes(avLabel)) return false;
                }
                return true;
              });
              return (
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-primary flex-shrink-0">Détail tâche</h2>
                  <div className="flex flex-wrap items-center gap-2 ml-auto">
                    <MultiSelect
                      label="Assigné à"
                      options={[...new Set(taches.map(t => t.assigneA ? `${t.assigneA.prenoms} ${t.assigneA.nom}` : '—'))]}
                      selected={dtAssigne}
                      onChange={setDtAssigne}
                    />
                    <MultiSelect
                      label="Priorité"
                      options={['Bloquant', 'Critique', 'Normal']}
                      selected={dtPriorite}
                      onChange={setDtPriorite}
                    />
                    <MultiSelect
                      label="Statut"
                      options={['À planifier', 'A faire', 'En cours', 'En attente', 'Terminé', 'Validé']}
                      selected={dtStatut}
                      onChange={setDtStatut}
                    />
                    <MultiSelect
                      label="Avancement"
                      options={["En avance", "À l'heure", "En retard", "Hors délai"]}
                      selected={dtAvancement}
                      onChange={setDtAvancement}
                    />
                    <TaskSearchSelect
                      taches={tachesDt}
                      selectedId={selectedTaskId}
                      onSelect={openDetail}
                    />
                    {(dtAssigne.length || dtPriorite.length || dtStatut.length || dtAvancement.length) ? (
                      <button
                        type="button"
                        onClick={() => { setDtAssigne([]); setDtPriorite([]); setDtStatut([]); setDtAvancement([]); }}
                        className="text-xs text-slate-400 hover:text-red-500 underline"
                      >
                        Réinitialiser
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })()}
          </div>

          {!selectedTask ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
              Sélectionnez une tâche dans la liste déroulante ou cliquez sur &quot;+&quot; dans la liste des tâches.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

              {/* LEFT: Champs modifiables */}
              <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                <h3 className="font-semibold text-slate-700 text-sm border-b border-slate-100 pb-3">Informations de la tâche</h3>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Libellé <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={detailEdit.libelle ?? ''}
                    onChange={e => setDetailEdit((d: any) => ({ ...d, libelle: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                  <textarea
                    value={detailEdit.description ?? selectedTask.description ?? ''}
                    onChange={e => setDetailEdit((d: any) => ({ ...d, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Priorité</label>
                    <select
                      value={detailEdit.priorite ?? ''}
                      onChange={e => setDetailEdit((d: any) => ({ ...d, priorite: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option>Bloquant</option>
                      <option>Critique</option>
                      <option>Normal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Assignée à</label>
                    <select
                      value={detailEdit.assigneAId ?? ''}
                      onChange={e => setDetailEdit((d: any) => ({ ...d, assigneAId: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="">— Non assigné —</option>
                      {ressources.map(m => (
                        <option key={m.id} value={m.id}>{m.prenoms} {m.nom} ({m.fonction})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Statut d&apos;exécution</label>
                    <select
                      value={detailEdit.statut ?? selectedTask.statut}
                      onChange={e => setDetailEdit((d: any) => ({ ...d, statut: e.target.value }))}
                      className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium ${STATUT_COLORS[detailEdit.statut ?? selectedTask.statut] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {getAllowedNextStatuts(selectedTask).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Statut d&apos;avancement</label>
                    {selectedAvancement && selectedTask.statut !== 'À planifier' ? (
                      <div className={`inline-flex px-3 py-2 rounded-lg text-sm font-medium ${AVANCEMENT_BADGE[selectedAvancement].classes}`}>
                        {AVANCEMENT_BADGE[selectedAvancement].label}
                      </div>
                    ) : (
                      <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-400">—</div>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-600 mb-2">Dates prévisionnelles</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(session?.estSuperAdmin || ['À planifier', 'A faire'].includes(selectedTask.statut)) ? (
                      <>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Début</label>
                          <input
                            type="date"
                            value={detailEdit.dateDebutPrevisionnelle ?? ''}
                            onChange={e => setDetailEdit((d: any) => ({ ...d, dateDebutPrevisionnelle: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Fin</label>
                          <input
                            type="date"
                            value={detailEdit.dateFinPrevisionnelle ?? ''}
                            onChange={e => setDetailEdit((d: any) => ({ ...d, dateFinPrevisionnelle: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Début</label>
                          <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700">{fmtDate(selectedTask.dateDebutPrevisionnelle)}</div>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Fin</label>
                          <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700">{fmtDate(selectedTask.dateFinPrevisionnelle)}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-600 mb-2">Dates effectives</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Début</label>
                      <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700">{fmtDate(selectedTask.dateDebutEffective)}</div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Fin</label>
                      <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700">{fmtDate(selectedTask.dateFinEffective)}</div>
                    </div>
                  </div>
                </div>

                {/* ── Checklist sous-tâches ─────────────────────────── */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <ListChecks size={13} />
                      Sous-tâches
                      {sousTaches.length > 0 && (
                        <span className="text-slate-400 font-normal">
                          {sousTaches.filter(s => s.estFaite).length}/{sousTaches.length}
                        </span>
                      )}
                    </h4>
                  </div>

                  {/* Barre de progression */}
                  {sousTaches.length > 0 && (
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.round((sousTaches.filter(s => s.estFaite).length / sousTaches.length) * 100)}%` }}
                      />
                    </div>
                  )}

                  {/* Liste */}
                  {stLoading ? (
                    <p className="text-xs text-slate-400">Chargement…</p>
                  ) : (
                    <div className="space-y-1">
                      {sousTaches.map(st => (
                        <div key={st.id} className="flex items-center gap-2 group">
                          <input
                            type="checkbox"
                            checked={st.estFaite}
                            onChange={() => handleStToggle(st)}
                            className="h-3.5 w-3.5 accent-emerald-600 flex-shrink-0"
                          />
                          {stEditId === st.id ? (
                            <div className="flex flex-1 items-center gap-1 min-w-0">
                              <input
                                type="text"
                                value={stEditLibelle}
                                onChange={e => setStEditLibelle(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleStEditSave(); if (e.key === 'Escape') { setStEditId(null); } }}
                                autoFocus
                                className="flex-1 px-2 py-0.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 min-w-0"
                              />
                              <button onClick={handleStEditSave} className="p-1 rounded hover:bg-emerald-50 text-emerald-600"><Check size={11} /></button>
                              <button onClick={() => setStEditId(null)} className="p-1 rounded hover:bg-slate-100 text-slate-400"><X size={11} /></button>
                            </div>
                          ) : (
                            <>
                              <span
                                onDoubleClick={() => { setStEditId(st.id); setStEditLibelle(st.libelle); }}
                                className={`flex-1 text-xs cursor-default select-none ${st.estFaite ? 'line-through text-slate-400' : 'text-slate-700'}`}
                                title="Double-cliquer pour modifier"
                              >
                                {st.libelle}
                              </span>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button
                                  onClick={() => { setStEditId(st.id); setStEditLibelle(st.libelle); }}
                                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-primary"
                                ><Pencil size={10} /></button>
                                <button
                                  onClick={() => handleStDelete(st.id)}
                                  className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                                ><Trash2 size={10} /></button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ajouter */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={stNewLibelle}
                      onChange={e => setStNewLibelle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleStAdd(); }}
                      placeholder="Ajouter une sous-tâche…"
                      className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                    <button
                      onClick={handleStAdd}
                      disabled={stAdding || !stNewLibelle.trim()}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-primary hover:text-white disabled:opacity-40 transition text-slate-600"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                {detailError && <p className="text-xs text-red-600">{detailError}</p>}

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleDetailSave}
                    disabled={detailSaving}
                    className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold"
                  >
                    {detailSaving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                  {!deleteTaskConfirm ? (
                    <button
                      onClick={() => { setDeleteTaskConfirm(true); setDeleteTaskError(''); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50"
                    >
                      <Trash2 size={13} /> Supprimer la tâche
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <span className="text-xs text-red-700 font-medium">Supprimer &laquo;{selectedTask.libelle}&raquo; ?</span>
                      <button
                        onClick={handleDeleteTask}
                        disabled={deleteTaskLoading}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded text-xs font-semibold"
                      >
                        {deleteTaskLoading ? 'Suppression…' : 'Confirmer'}
                      </button>
                      <button
                        onClick={() => { setDeleteTaskConfirm(false); setDeleteTaskError(''); }}
                        disabled={deleteTaskLoading}
                        className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded text-xs"
                      >
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
                {deleteTaskError && <p className="text-xs text-red-600">{deleteTaskError}</p>}
              </div>

              {/* RIGHT: Commentaires */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
                <h3 className="font-semibold text-slate-700 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                  <MessageSquare size={15} />
                  Commentaires
                  <span className="ml-auto text-xs text-slate-400">{commentairesLoading ? '…' : commentaires.length}</span>
                </h3>

                <div className="space-y-2">
                  <textarea
                    value={commentaireText}
                    onChange={e => setCommentaireText(e.target.value)}
                    placeholder="Écrire un commentaire…"
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                  <button
                    onClick={() => submitComment(commentaireText)}
                    disabled={!commentaireText.trim() || commentSubmitting}
                    className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    <Send size={13} />
                    Valider
                  </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto max-h-[480px] pr-1">
                  {commentairesLoading ? (
                    <p className="text-xs text-slate-400 text-center py-4">Chargement…</p>
                  ) : commentaires.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">Aucun commentaire pour l&apos;instant.</p>
                  ) : (
                    commentaires.map(c => (
                      <div key={c.id} className="space-y-2">
                        <div className="bg-slate-50 rounded-xl p-3 text-sm">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-semibold text-slate-700 text-xs">{getAuthorName(c.compteAcces)}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs text-slate-400">{fmtDate(c.dateCreation)}</span>
                              <button
                                onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.contenu); setDeleteCommentId(null); }}
                                className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-primary"
                                title="Modifier"
                              ><Pencil size={11} /></button>
                              <button
                                onClick={() => { setDeleteCommentId(deleteCommentId === c.id ? null : c.id); setEditingCommentId(null); }}
                                className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600"
                                title="Supprimer"
                              ><Trash2 size={11} /></button>
                            </div>
                          </div>
                          {editingCommentId === c.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editCommentText}
                                onChange={e => setEditCommentText(e.target.value)}
                                rows={3}
                                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditComment(c.id)}
                                  disabled={editCommentSaving || !editCommentText.trim()}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded text-xs font-semibold"
                                ><Check size={11} /> {editCommentSaving ? 'Enreg…' : 'Enregistrer'}</button>
                                <button
                                  onClick={() => setEditingCommentId(null)}
                                  className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded text-xs"
                                >Annuler</button>
                              </div>
                            </div>
                          ) : deleteCommentId === c.id ? (
                            <div className="flex items-center gap-2 mt-1 bg-red-50 border border-red-100 rounded-lg px-2 py-1.5">
                              <span className="text-xs text-red-700 flex-1">Supprimer ce commentaire ?</span>
                              <button
                                onClick={() => handleDeleteComment(c.id)}
                                disabled={deleteCommentLoading}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded text-xs font-semibold"
                              >{deleteCommentLoading ? '…' : 'Confirmer'}</button>
                              <button
                                onClick={() => setDeleteCommentId(null)}
                                className="px-2.5 py-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded text-xs"
                              >Annuler</button>
                            </div>
                          ) : (
                            <>
                              <p className="text-slate-600 whitespace-pre-wrap">{c.contenu}</p>
                              <button
                                onClick={() => { setReplyingTo(replyingTo === c.id ? null : c.id); setReplyText(''); }}
                                className="mt-2 flex items-center gap-1 text-xs text-secondary hover:underline"
                              >
                                <CornerDownRight size={11} /> Répondre
                              </button>
                            </>
                          )}
                        </div>

                        {c.reponses && c.reponses.length > 0 && (
                          <div className="pl-4 space-y-2">
                            {c.reponses.map(r => (
                              <div key={r.id} className="bg-white border border-slate-100 rounded-xl p-3 text-sm">
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <span className="font-semibold text-slate-700 text-xs">{getAuthorName(r.compteAcces)}</span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-xs text-slate-400">{fmtDate(r.dateCreation)}</span>
                                    <button
                                      onClick={() => { setEditingCommentId(r.id); setEditCommentText(r.contenu); setDeleteCommentId(null); }}
                                      className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-primary"
                                      title="Modifier"
                                    ><Pencil size={11} /></button>
                                    <button
                                      onClick={() => { setDeleteCommentId(deleteCommentId === r.id ? null : r.id); setEditingCommentId(null); }}
                                      className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600"
                                      title="Supprimer"
                                    ><Trash2 size={11} /></button>
                                  </div>
                                </div>
                                {editingCommentId === r.id ? (
                                  <div className="space-y-2">
                                    <textarea
                                      value={editCommentText}
                                      onChange={e => setEditCommentText(e.target.value)}
                                      rows={2}
                                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleEditComment(r.id)}
                                        disabled={editCommentSaving || !editCommentText.trim()}
                                        className="flex items-center gap-1 px-2.5 py-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded text-xs font-semibold"
                                      ><Check size={11} /> {editCommentSaving ? 'Enreg…' : 'Enregistrer'}</button>
                                      <button
                                        onClick={() => setEditingCommentId(null)}
                                        className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded text-xs"
                                      >Annuler</button>
                                    </div>
                                  </div>
                                ) : deleteCommentId === r.id ? (
                                  <div className="flex items-center gap-2 mt-1 bg-red-50 border border-red-100 rounded-lg px-2 py-1.5">
                                    <span className="text-xs text-red-700 flex-1">Supprimer cette réponse ?</span>
                                    <button
                                      onClick={() => handleDeleteComment(r.id)}
                                      disabled={deleteCommentLoading}
                                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded text-xs font-semibold"
                                    >{deleteCommentLoading ? '…' : 'Confirmer'}</button>
                                    <button
                                      onClick={() => setDeleteCommentId(null)}
                                      className="px-2.5 py-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded text-xs"
                                    >Annuler</button>
                                  </div>
                                ) : (
                                  <p className="text-slate-600 whitespace-pre-wrap">{r.contenu}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {replyingTo === c.id && (
                          <div className="pl-4 space-y-2">
                            <textarea
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              placeholder="Écrire une réponse…"
                              rows={2}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => submitComment(replyText, c.id)}
                                disabled={!replyText.trim() || commentSubmitting}
                                className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/90 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                              >
                                <Send size={11} /> Répondre
                              </button>
                              <button
                                onClick={() => setReplyingTo(null)}
                                className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ── Historique d'activité ── */}
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  Historique
                  <span className="ml-auto text-xs text-slate-400">{activitesLoading ? '…' : activites.length}</span>
                </h3>
                {activitesLoading ? (
                  <p className="text-xs text-slate-400 text-center py-3">Chargement…</p>
                ) : activites.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-3">Aucune activité enregistrée.</p>
                ) : (
                  <ol className="relative border-l border-slate-200 space-y-3 ml-2">
                    {activites.map(a => (
                      <li key={a.id} className="ml-4">
                        <span className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full border-2 border-white bg-slate-300" />
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ACTIVITE_COLORS[a.type] ?? 'bg-slate-100 text-slate-600'}`}>
                            {a.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-slate-700">{formatActiviteDetail(a.type, a.detail)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {getActiviteAuthor(a)} · {fmtDate(a.dateCreation)}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
