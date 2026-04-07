'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutGrid, List } from 'lucide-react';

interface Projet {
  id: string;
  libelle: string;
  description?: string;
  statut: string;
  etatAvancement?: string;
  dateCreation: string;
  dateDebutPrevisionnelle?: string;
  dateFinPrevisionnelle?: string;
  chefProjet?: { id: string; nom: string; prenoms: string };
  equipeProjet: any[];
  taches: any[];
}

interface Personne {
  id: string;
  nom: string;
  prenoms: string;
  fonction: string;
  estChefProjet?: boolean;
}

type Avancement = 'a-lheure' | 'retard' | 'en-avance' | 'hors-delai';

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

const AVANCEMENT_CONFIG: Record<Avancement, { label: string; classes: string }> = {
  'a-lheure':   { label: 'À l\'heure', classes: 'bg-blue-100 text-blue-700' },
  retard:       { label: 'En retard',  classes: 'bg-orange-100 text-orange-700' },
  'en-avance':  { label: 'En avance',  classes: 'bg-green-100 text-green-700' },
  'hors-delai': { label: 'Hors délai', classes: 'bg-red-100 text-red-700' },
};

function getAvanancementProjet(projet: Projet): Avancement | null {
  const STATUTS_ACTIFS = ['En démarrage', 'En cours'];
  if (!STATUTS_ACTIFS.includes(projet.statut)) return null;

  const now = Date.now();
  const fin = projet.dateFinPrevisionnelle ? new Date(projet.dateFinPrevisionnelle).getTime() : null;
  const tasks = projet.taches ?? [];
  const totalTasks = tasks.length;

  // Si la date prévisionnelle de fin est dépassée
  if (fin && fin <= now) {
    if (totalTasks === 0) return 'hors-delai';
    const doneTasks = tasks.filter((t: any) => t.statut === 'Terminé' || t.statut === 'Validé').length;
    return doneTasks < totalTasks ? 'hors-delai' : 'en-avance';
  }

  // Date non dépassée — comparer taux effectif vs taux prévisionnel
  if (totalTasks === 0) return 'en-avance';
  const doneTasks = tasks.filter((t: any) => t.statut === 'Terminé' || t.statut === 'Validé').length;
  const tauxEffectif = doneTasks / totalTasks;
  const tasksDuByNow = tasks.filter((t: any) => {
    const fp = t.dateFinPrevisionnelle ? new Date(t.dateFinPrevisionnelle).getTime() : null;
    return fp !== null && fp <= now;
  }).length;
  const tauxPrevisionnel = tasksDuByNow / totalTasks;

  return tauxEffectif < tauxPrevisionnel ? 'retard' : 'en-avance';
}

export default function ProjetsPage() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [entites, setEntites] = useState<{ id: string; libelle: string; typeEntite?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ libelle: '', description: '', chefProjetId: '', entiteId: '', dateDebutPrevisionnelle: '', dateFinPrevisionnelle: '' });
  const [formError, setFormError] = useState('');
  const [view, setView] = useState<'card' | 'list'>('list');
  const [fStatut, setFStatut] = useState('');
  const [fAvancement, setFAvancement] = useState('');
  const [fChefProjetId, setFChefProjetId] = useState('');

  useEffect(() => {
    fetchProjets();
    fetchPersonnes();
    fetch('/api/entites').then(r => r.json()).then(d => setEntites(Array.isArray(d) ? d : []));
  }, []);

  const fetchProjets = async () => {
    try {
      const res = await fetch('/api/projets');
      const data = await res.json();

      if (!res.ok) {
        setProjets([]);
        return;
      }

      setProjets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
      setProjets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonnes = async () => {
    try {
      const res = await fetch('/api/personnes');
      const data = await res.json();
      setPersonnes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des personnes:', error);
      setPersonnes([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.chefProjetId) {
      setFormError('Veuillez sélectionner un chef de projet.');
      return;
    }
    if (!formData.dateDebutPrevisionnelle) {
      setFormError('La date de début prévisionnelle est obligatoire.');
      return;
    }
    if (!formData.dateFinPrevisionnelle) {
      setFormError('La date de fin prévisionnelle est obligatoire.');
      return;
    }

    try {
      const res = await fetch('/api/projets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          libelle: formData.libelle,
          description: formData.description,
          chefProjetId: formData.chefProjetId,
          entiteId: formData.entiteId || null,
          dateDebutPrevisionnelle: formData.dateDebutPrevisionnelle,
          dateFinPrevisionnelle: formData.dateFinPrevisionnelle,
        }),
      });

      if (!res.ok) {
        const payload = await res.json();
        setFormError(payload?.error || 'Erreur lors de la creation du projet.');
        return;
      }

      if (res.ok) {
        await fetchProjets();
        setFormData({ libelle: '', description: '', chefProjetId: '', entiteId: '', dateDebutPrevisionnelle: '', dateFinPrevisionnelle: '' });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Erreur lors de la création du projet:', error);
      setFormError('Erreur reseau lors de la creation du projet.');
    }
  };

  const chefs = Array.from(
    new Map(
      projets
        .filter(p => p.chefProjet)
        .map(p => [p.chefProjet!.id, p.chefProjet!])
    ).values()
  ).sort((a, b) => a.nom.localeCompare(b.nom));

  const filteredProjets = projets.filter(p => {
    if (fStatut && p.statut !== fStatut) return false;
    if (fChefProjetId && p.chefProjet?.id !== fChefProjetId) return false;
    if (fAvancement) {
      const av = (p.etatAvancement ?? getAvanancementProjet(p)) as Avancement | null;
      if (av !== fAvancement) return false;
    }
    return true;
  });
  const hasFilters = !!(fStatut || fAvancement || fChefProjetId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-primary">Projets</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={fStatut}
            onChange={e => setFStatut(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="">Tous statuts</option>
            {['En démarrage', 'En cours', 'Terminé', 'Clôturé', 'Suspendu'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={fAvancement}
            onChange={e => setFAvancement(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="">Tout avancement</option>
            {(Object.entries(AVANCEMENT_CONFIG) as [Avancement, { label: string; classes: string }][]).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <select
            value={fChefProjetId}
            onChange={e => setFChefProjetId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="">Tous chefs de projet</option>
            {chefs.map(c => (
              <option key={c.id} value={c.id}>{c.prenoms} {c.nom}</option>
            ))}
          </select>
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setFStatut(''); setFAvancement(''); setFChefProjetId(''); }}
              className="text-xs text-slate-400 underline hover:text-slate-600"
            >
              Réinitialiser
            </button>
          )}
          {hasFilters && (
            <span className="text-xs text-slate-400">{filteredProjets.length} résultat{filteredProjets.length !== 1 ? 's' : ''}</span>
          )}
          <div className="h-5 w-px bg-slate-200 mx-1" />
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setView('card')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                view === 'card' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
              title="Vue cartes"
            >
              <LayoutGrid size={14} />
              Cartes
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                view === 'list' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
              title="Vue liste"
            >
              <List size={14} />
              Liste
            </button>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-secondary hover:bg-secondary/90 text-white px-6 py-2 rounded-lg font-semibold"
          >
            + Nouveau projet
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Libellé *</label>
            <input
              type="text"
              required
              value={formData.libelle}
              onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Nom du projet"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Description du projet"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Chef de projet *</label>
            <select
              required
              value={formData.chefProjetId}
              onChange={(e) => setFormData({ ...formData, chefProjetId: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Selectionner une personne</option>
              {personnes.map((personne) => (
                <option key={personne.id} value={personne.id}>
                  {personne.nom} {personne.prenoms} - {personne.fonction}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Entité porteuse (Owner)</label>
            <select
              value={formData.entiteId}
              onChange={(e) => setFormData({ ...formData, entiteId: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">— Aucune —</option>
              {entites.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.typeEntite ? `[${e.typeEntite}] ` : ''}{e.libelle}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Début prévisionnel <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={formData.dateDebutPrevisionnelle}
                onChange={(e) => setFormData({ ...formData, dateDebutPrevisionnelle: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fin prévisionnelle <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                min={formData.dateDebutPrevisionnelle || undefined}
                value={formData.dateFinPrevisionnelle}
                onChange={(e) => setFormData({ ...formData, dateFinPrevisionnelle: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg"
            >
              Créer
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : projets.length === 0 ? (
        <p className="text-gray-500">Aucun projet créé.</p>
      ) : filteredProjets.length === 0 ? (
        <p className="text-gray-500">Aucun projet ne correspond aux filtres sélectionnés.</p>
      ) : view === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjets.map((projet) => {
            const avancement = (projet.etatAvancement ?? getAvanancementProjet(projet)) as Avancement | null;
            const avCfg = avancement ? (AVANCEMENT_CONFIG[avancement] ?? null) : null;
            return (
            <Link
              key={projet.id}
              href={`/projets/${projet.id}`}
              className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg hover:border-primary border border-transparent transition cursor-pointer"
            >
              <h2 className="text-xl font-semibold text-primary mb-2">{projet.libelle}</h2>
              {projet.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{projet.description}</p>
              )}
              <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
                <span className="inline-block px-2 py-1 rounded text-sm font-medium" style={getProjetStatutStyle(projet.statut)}>
                  {projet.statut}
                </span>
                {avCfg && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${avCfg.classes}`}>
                    {avCfg.label}
                  </span>
                )}
                <span className="text-sm text-gray-500">Équipe: {projet.equipeProjet.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                <span>Tâches: {projet.taches.length}</span>
                {projet.dateFinPrevisionnelle && (
                  <span>Fin prév. {new Date(projet.dateFinPrevisionnelle).toLocaleDateString('fr-FR')}</span>
                )}
              </div>
            </Link>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Projet</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Statut</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Avancement</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Chef de projet</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Équipe</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Tâches</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Fin prévisionnelle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjets.map((projet) => {
                const avancement = (projet.etatAvancement ?? getAvanancementProjet(projet)) as Avancement | null;
                const avCfg = avancement ? (AVANCEMENT_CONFIG[avancement] ?? null) : null;
                return (
                  <tr key={projet.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <Link href={`/projets/${projet.id}`} className="font-semibold text-primary hover:underline">
                        {projet.libelle}
                      </Link>
                      {projet.description && (
                        <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{projet.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded px-2 py-0.5 text-xs font-medium" style={getProjetStatutStyle(projet.statut)}>
                        {projet.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {avCfg ? (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${avCfg.classes}`}>
                          {avCfg.label}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700 text-xs">
                      {projet.chefProjet ? `${projet.chefProjet.prenoms} ${projet.chefProjet.nom}` : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 font-medium">{projet.equipeProjet.length}</td>
                    <td className="px-4 py-3 text-center text-slate-600 font-medium">{projet.taches.length}</td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">
                      {projet.dateFinPrevisionnelle
                        ? new Date(projet.dateFinPrevisionnelle).toLocaleDateString('fr-FR')
                        : <span className="text-slate-300">—</span>}
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
}
