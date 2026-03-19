'use client';

interface GanttTask {
  id: string;
  libelle: string;
  dateDebutPrevisionnelle?: string;
  dateFinPrevisionnelle?: string;
  statut: string;
}

interface ProjectGanttProps {
  tasks: GanttTask[];
  title?: string;
}

export default function ProjectGantt({ tasks, title }: ProjectGanttProps) {
  const tachesAvecDates = tasks.filter((t) => t.dateDebutPrevisionnelle && t.dateFinPrevisionnelle);

  if (tachesAvecDates.length === 0) {
    return <div className="p-6 bg-white rounded-lg shadow">Aucune tache avec dates prevues</div>;
  }

  const dates = tachesAvecDates.flatMap((t) => [
    new Date(t.dateDebutPrevisionnelle!).getTime(),
    new Date(t.dateFinPrevisionnelle!).getTime(),
  ]);

  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));

  const getTaskPosition = (task: GanttTask) => {
    if (!task.dateDebutPrevisionnelle || !task.dateFinPrevisionnelle) return { start: 0, width: 0 };

    const start = new Date(task.dateDebutPrevisionnelle).getTime();
    const end = new Date(task.dateFinPrevisionnelle).getTime();
    const startOffset = (start - minDate.getTime()) / (1000 * 60 * 60 * 24);
    const duration = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));

    return {
      start: (startOffset / totalDays) * 100,
      width: (duration / totalDays) * 100,
    };
  };

  const getColor = (statut: string) => {
    switch (statut) {
      case 'Termine':
      case 'Terminé':
      case 'Valide':
      case 'Validé':
        return 'bg-green-500';
      case 'En cours':
        return 'bg-blue-500';
      case 'Bloque':
      case 'Bloqué':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {title && <h2 className="text-xl font-bold text-primary">{title}</h2>}

      <div className="bg-white shadow-sm rounded-2xl border border-slate-200 p-6 overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="flex mb-6">
            <div className="w-44 flex-shrink-0" />
            <div className="flex-1 flex text-xs text-gray-600 border-b border-slate-200">
              {Array.from({ length: Math.min(totalDays + 1, 30) }).map((_, i) => (
                <div key={i} className="flex-1 text-center py-1">
                  {new Date(minDate.getTime() + i * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              ))}
            </div>
          </div>

          {tachesAvecDates.map((task) => {
            const pos = getTaskPosition(task);
            return (
              <div key={task.id} className="flex mb-4 items-center gap-4">
                <div className="w-40 flex-shrink-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{task.libelle}</p>
                  <p className="text-xs text-gray-500">{task.statut}</p>
                </div>
                <div className="flex-1 relative bg-gray-100 h-8 rounded">
                  <div
                    className={`absolute h-full rounded flex items-center px-2 text-white text-xs font-semibold ${getColor(task.statut)}`}
                    style={{
                      left: `${Math.max(0, pos.start)}%`,
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
