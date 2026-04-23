import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { calculerDatesOccurrences } from '@/lib/occurrence-generator';

// Route appelée quotidiennement (ex: Vercel Cron, Railway Cron, ou timer externe)
// Protégée par un secret partagé dans CRON_SECRET
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const bearer = request.headers.get('authorization');
    const legacy = request.headers.get('x-cron-secret');
    const ok = bearer === `Bearer ${expected}` || legacy === expected;
    if (!ok) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }
  }

  const maintenant  = new Date();
  const horizon     = new Date(maintenant);
  horizon.setDate(horizon.getDate() + 30); // générer J+30

  let creees   = 0;
  let miseEnRetard = 0;

  try {
    // ── 1. Marquer "En retard" les occurrences échues non clôturées ───────────
    const retard = await prisma.occurrenceTache.updateMany({
      where: {
        statut:       { in: ['En attente', 'En cours'] },
        dateEcheance: { lt: maintenant },
      },
      data: { statut: 'En retard' },
    });
    miseEnRetard = retard.count;

    // ── 2. Générer les occurrences à venir ────────────────────────────────────
    const taches = await prisma.tacheOperationnelle.findMany({
      where: {
        estActif:  true,
        dateDebut: { lte: horizon },
        OR: [
          { dateFin: null },
          { dateFin: { gte: maintenant } },
        ],
        operation: { statut: 'Active' },
      },
      include: {
        occurrences: {
          where:  { datePrevue: { gte: maintenant } },
          select: { datePrevue: true },
        },
      },
    });

    for (const tache of taches) {
      const datesExistantes = new Set(
        tache.occurrences.map(o => o.datePrevue.toISOString().slice(0, 10))
      );

      const nouvelles = calculerDatesOccurrences(
        tache.periodicite,
        tache.configPeriodicite,
        tache.dateDebut,
        tache.dateFin,
        maintenant,
        horizon,
      );

      for (const datePrevue of nouvelles) {
        const cle = datePrevue.toISOString().slice(0, 10);
        if (datesExistantes.has(cle)) continue;

        const dateEcheance = new Date(datePrevue);
        dateEcheance.setDate(dateEcheance.getDate() + tache.delaiExecution);

        await prisma.occurrenceTache.create({
          data: {
            tacheOperationnelleId: tache.id,
            datePrevue,
            dateEcheance,
            statut:       'En attente',
            realiseParId: tache.responsableId ?? null,
          },
        });
        creees++;
      }
    }

    return NextResponse.json({
      ok:            true,
      occurrencesCreees:     creees,
      occurrencesMiseEnRetard: miseEnRetard,
      executéLe:     maintenant.toISOString(),
      horizon:       horizon.toISOString(),
    });
  } catch (error) {
    console.error('[cron/generer-occurrences]', error);
    return NextResponse.json({ error: 'Erreur lors de la génération.' }, { status: 500 });
  }
}
