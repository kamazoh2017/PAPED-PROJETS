import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';

export async function GET(request: NextRequest) {
  const { err } = await requireAuth(request);
  if (err) return err;

  const { searchParams } = new URL(request.url);
  const entiteId = searchParams.get('entiteId');

  try {
    // Récupère toutes les PersonneRessource de l'entité (et sous-entités si besoin)
    const personnes = await prisma.personneRessource.findMany({
      where: entiteId ? { entiteId } : {},
      select: { id: true, nom: true, prenoms: true, fonction: true, entiteId: true },
      orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }],
    });
    const personneIds = personnes.map(p => p.id);

    if (!personneIds.length) {
      return NextResponse.json({ personnes: [], membres: [] });
    }

    // Tâches actives par personne
    const taches = await prisma.tache.findMany({
      where: {
        assigneAId: { in: personneIds },
        statut: { notIn: ['Terminé', 'Validé'] },
      },
      select: {
        id: true, libelle: true, statut: true, priorite: true,
        dateFinPrevisionnelle: true, assigneAId: true,
        projet: { select: { id: true, libelle: true } },
      },
    });

    // Occurrences actives par personne (via tache.responsable)
    const occurrences = await prisma.occurrenceTache.findMany({
      where: {
        statut: { notIn: ['Réalisée', 'Réalisée en retard', 'Annulée'] },
        tacheOperationnelle: { responsableId: { in: personneIds } },
      },
      select: {
        id: true, statut: true, dateEcheance: true,
        tacheOperationnelle: {
          select: {
            id: true, libelle: true, responsableId: true,
            operation: { select: { id: true, libelle: true } },
          },
        },
      },
    });

    const now = new Date();

    // Consolider par personne
    const membres = personnes.map(p => {
      const tachesMembre   = taches.filter(t => t.assigneAId === p.id);
      const occsMembre     = occurrences.filter(o => o.tacheOperationnelle.responsableId === p.id);
      const tachesRetard   = tachesMembre.filter(t => {
        const fin = t.dateFinPrevisionnelle ? new Date(t.dateFinPrevisionnelle) : null;
        return fin && fin < now;
      }).length;
      const occsEnRetard   = occsMembre.filter(o => o.statut === 'En retard').length;

      return {
        personne: p,
        kpis: {
          tachesActives:      tachesMembre.length,
          tachesEnRetard:     tachesRetard,
          occurrencesActives: occsMembre.length,
          occsEnRetard,
        },
        taches:      tachesMembre,
        occurrences: occsMembre,
      };
    });

    return NextResponse.json({ personnes, membres });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
