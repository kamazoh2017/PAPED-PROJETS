'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Tache {
  id: string;
  libelle: string;
  dateDebutPrevisionnelle?: string;
  dateFinPrevisionnelle?: string;
  statut: string;
  priorite: string;
}

interface Projet {
  id: string;
  libelle: string;
  taches: Tache[];
}

export default function GanttPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [projet, setProjet] = useState<Projet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchProjet();
    }
  }, [projectId]);

  const fetchProjet = async () => {
    try {
      const res = await fetch(`/api/projets/${projectId}`);
      const data = await res.json();
      setProjet(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (!projet) return <div>Projet non trouvé</div>;

  const tachesAvecDates = projet.taches.filter((t) => t.dateDebutPrevisionnelle && t.dateFinPrevisionnelle);

  if (tachesAvecDates.length === 0) {
    return <div className="p-6 bg-white rounded-lg shadow">Aucune tâche avec dates prévues</div>;
  }

  const dates = tachesAvecDates.flatMap((t) => [
    new Date(t.dateDebutPrevisionnelle!).getTime(),
    new Date(t.dateFinPrevisionnelle!).getTime(),
  ]);

  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) || 0;

  const getTaskPosition = (task: Tache) => {
    if (!task.dateDebutPrevisionnelle || !task.dateFinPrevisionnelle) return { start: 0, width: 0 };

    const start = new Date(task.dateDebutPrevisionnelle).getTime();
    const end = new Date(task.dateFinPrevisionnelle).getTime();
    const startOffset = (start - minDate.getTime()) / (1000 * 60 * 60 * 24);
    const duration = (end - start) / (1000 * 60 * 60 * 24);

    const startPercent = (startOffset / totalDays) * 100;
    const widthPercent = (duration / totalDays) * 100;

    return { start: startPercent, width: widthPercent };
  };

  const getColor = (statut: string) => {
    switch (statut) {
      case 'Terminé':
        return 'bg-green-500';
      case 'En cours':
        return 'bg-blue-500';
      case 'Bloqué':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-primary">{projet.libelle} - Diagramme de Gantt</h1>

      <div className="bg-white shadow-md rounded-lg p-6 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Timeline header */}
          <div className="flex mb-6">
            <div className="w-40 flex-shrink-0" />
            <div className="flex-1 flex text-xs text-gray-600 border-b">
              {Array.from({ length: Math.min(totalDays, 30) }).map((_, i) => (
                <div key={i} className="flex-1 text-center">
                  {new Date(minDate.getTime() + i * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          {tachesAvecDates.map((task) => {
            const pos = getTaskPosition(task);
            return (
              <div key={task.id} className="flex mb-4 items-center">
                <div className="w-40 flex-shrink-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{task.libelle}</p>
                  <p className="text-xs text-gray-500">{task.statut}</p>
                </div>
                <div className="flex-1 relative bg-gray-100 h-8 rounded">
                  <div
                    className={`absolute h-full rounded flex items-center px-2 text-white text-xs font-semibold ${getColor(task.statut)}`}
                    style={{
                      left: `${pos.start}%`,
                      width: `${Math.max(pos.width, 2)}%`,
                    }}
                  >
                    {pos.width > 10 && task.libelle}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
