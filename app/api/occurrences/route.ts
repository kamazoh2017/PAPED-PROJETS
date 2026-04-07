import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden } from '@/lib/require-auth';

const OCC_INCLUDE = {
  tacheOperationnelle: {
    include: {
      operation: { select: { id: true, libelle: true, entiteId: true, entite: true } },
    },
  },
  realisePar: { include: { entite: true } },
} as const;

export async function GET(request: NextRequest) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'operations', 'view')) return forbidden();

  const { searchParams } = new URL(request.url);
  const statut        = searchParams.get('statut');
  const responsableId = searchParams.get('responsableId');
  const operationId   = searchParams.get('operationId');
  const dateDebut     = searchParams.get('dateDebut');
  const dateFin       = searchParams.get('dateFin');

  try {
    const occurrences = await prisma.occurrenceTache.findMany({
      where: {
        ...(statut        ? { statut }                                            : {}),
        ...(responsableId ? { realiseParId: responsableId }                       : {}),
        ...(operationId   ? { tacheOperationnelle: { operationId } }              : {}),
        ...(dateDebut     ? { datePrevue: { gte: new Date(dateDebut) } }          : {}),
        ...(dateFin       ? { datePrevue: { lte: new Date(dateFin) } }            : {}),
      },
      include: OCC_INCLUDE,
      orderBy: { dateEcheance: 'asc' },
    });
    return NextResponse.json(occurrences);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la récupération.' }, { status: 500 });
  }
}
