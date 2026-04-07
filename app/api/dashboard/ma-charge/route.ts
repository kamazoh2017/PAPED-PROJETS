import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';

export async function GET(request: NextRequest) {
  const { user, err } = await requireAuth(request);
  if (err) return err;

  try {
    // Résoudre la PersonneRessource liée au compte connecté
    const compte = await prisma.compteAcces.findUnique({
      where: { id: user.compte.id },
      include: { personne: true },
    });
    const personneId = compte?.personne?.id ?? null;

    // Tâches projet actives assignées à l'utilisateur
    const tachesProjet = personneId
      ? await prisma.tache.findMany({
          where: {
            assigneAId: personneId,
            statut: { notIn: ['Terminé', 'Validé'] },
          },
          include: {
            projet: { select: { id: true, libelle: true, statut: true } },
          },
          orderBy: { dateFinPrevisionnelle: 'asc' },
        })
      : [];

    // Occurrences actives dont l'utilisateur est responsable (via tache) ou réalisateur
    const occurrences = personneId
      ? await prisma.occurrenceTache.findMany({
          where: {
            statut: { notIn: ['Réalisée', 'Réalisée en retard', 'Annulée'] },
            OR: [
              { tacheOperationnelle: { responsableId: personneId } },
              { realiseParId: personneId },
            ],
          },
          include: {
            tacheOperationnelle: {
              include: {
                operation: { select: { id: true, libelle: true, entite: { select: { id: true, libelle: true } } } },
              },
            },
          },
          orderBy: { dateEcheance: 'asc' },
        })
      : [];

    // KPIs synthèse
    const now = new Date();
    const tachesEnRetard = tachesProjet.filter(t => {
      const fin = t.dateFinPrevisionnelle ? new Date(t.dateFinPrevisionnelle) : null;
      return fin && fin < now;
    }).length;

    const occsEnRetard    = occurrences.filter(o => o.statut === 'En retard').length;
    const occsAujourdhui  = occurrences.filter(o => {
      const d = new Date(o.dateEcheance).toLocaleDateString('fr-FR');
      return d === now.toLocaleDateString('fr-FR');
    }).length;

    return NextResponse.json({
      personneId,
      kpis: {
        tachesActives:    tachesProjet.length,
        tachesEnRetard,
        occurrencesActives: occurrences.length,
        occsEnRetard,
        occsAujourdhui,
      },
      tachesProjet,
      occurrences,
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
