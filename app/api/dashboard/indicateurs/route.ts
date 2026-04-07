import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';

export async function GET(request: NextRequest) {
  const { err } = await requireAuth(request);
  if (err) return err;

  try {
    const now = new Date();
    const dans7j = new Date(now); dans7j.setDate(now.getDate() + 7);
    const il30j  = new Date(now); il30j.setDate(now.getDate() - 30);

    const [
      projetsActifs,
      tachesEnRetard,
      operationsActives,
      occsEnRetard,
      occsSemaine,
      occs30j,
    ] = await Promise.all([
      // Projets actifs
      prisma.projet.count({ where: { statut: { in: ['En démarrage', 'En cours'] } } }),

      // Tâches projet en retard (date fin dépassée, non terminée)
      prisma.tache.count({
        where: {
          dateFinPrevisionnelle: { lt: now },
          statut: { notIn: ['Terminé', 'Validé'] },
        },
      }),

      // Opérations actives
      prisma.operation.count({ where: { statut: 'Active' } }),

      // Occurrences en retard
      prisma.occurrenceTache.count({ where: { statut: 'En retard' } }),

      // Occurrences prévues dans les 7 prochains jours (non terminées)
      prisma.occurrenceTache.count({
        where: {
          datePrevue: { gte: now, lte: dans7j },
          statut: { notIn: ['Réalisée', 'Réalisée en retard', 'Annulée'] },
        },
      }),

      // Toutes les occurrences des 30 derniers jours (pour taux d'exécution)
      prisma.occurrenceTache.findMany({
        where: { datePrevue: { gte: il30j, lte: now } },
        select: { statut: true },
      }),
    ]);

    const occsRealisees30j = occs30j.filter(o =>
      o.statut === 'Réalisée' || o.statut === 'Réalisée en retard'
    ).length;
    const tauxExecution30j = occs30j.length
      ? Math.round((occsRealisees30j / occs30j.length) * 100)
      : null;

    return NextResponse.json({
      projetsActifs,
      tachesEnRetard,
      operationsActives,
      occsEnRetard,
      occsSemaine,
      tauxExecution30j,
      occsTotal30j: occs30j.length,
      occsRealisees30j,
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
