import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden } from '@/lib/require-auth';

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/projets/[id]/activites
 * Retourne la liste plate de toutes les activités du projet (à travers les résultats).
 * Utile pour les selects de rattachement.
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'cadre-logique', 'view')) return forbidden();

  const { id: projetId } = await params;

  const activites = await prisma.activite.findMany({
    where: { resultat: { projetId } },
    orderBy: [{ resultat: { code: 'asc' } }, { code: 'asc' }],
    select: {
      id: true,
      code: true,
      libelle: true,
      statut: true,
      parentActiviteId: true,
      resultat: { select: { id: true, code: true, libelle: true } },
    },
  });

  return NextResponse.json(activites);
}
