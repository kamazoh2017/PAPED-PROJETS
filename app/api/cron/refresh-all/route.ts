/**
 * GET /api/cron/refresh-all
 *
 * Recalcule chaque jour les métriques de tous les projets actifs :
 *   - etatAvancement de chaque tâche (dépend de "aujourd'hui")
 *   - etatAvancement du projet
 *   - tauxAvancementAttendu  (simulation à la date du jour)
 *   - tauxAvancementReel
 *   - tauxAchevementAttendu  (tâches dont finPrev <= aujourd'hui)
 *   - tauxAchevementReel
 *   - scores de risque
 *
 * Déclencheur : Vercel Cron Jobs (vercel.json) — tous les jours à 00:05 UTC.
 * Protection  : header Authorization: Bearer $CRON_SECRET
 *               (peut être omis en développement si CRON_SECRET est absent)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { refreshProjectMetrics } from '@/lib/refresh-project-metrics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // ── Vérification du secret (obligatoire en production) ────────────────────
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // ── Récupération des projets à rafraîchir (tous sauf Clôturé) ─────────────
  const projets = await prisma.projet.findMany({
    where: { statut: { not: 'Clôturé' } },
    select: { id: true, libelle: true },
  });

  const results: { id: string; libelle: string; ok: boolean; error?: string }[] = [];

  for (const projet of projets) {
    try {
      await refreshProjectMetrics(projet.id);
      results.push({ id: projet.id, libelle: projet.libelle, ok: true });
    } catch (err) {
      results.push({
        id: projet.id,
        libelle: projet.libelle,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const failed = results.filter((r) => !r.ok);
  return NextResponse.json({
    refreshed: results.length,
    failed: failed.length,
    results,
  });
}
