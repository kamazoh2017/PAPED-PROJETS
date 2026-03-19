'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProjectGantt from '@/components/ProjectGantt';

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

  return (
    <ProjectGantt tasks={projet.taches} title={`${projet.libelle} - Diagramme de Gantt`} />
  );
}
