import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden } from '@/lib/require-auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'operations', 'view')) return forbidden();

  const { searchParams } = new URL(request.url);
  const statut = searchParams.get('statut');

  try {
    const { id: tacheOperationnelleId } = await params;
    const occurrences = await prisma.occurrenceTache.findMany({
      where: {
        tacheOperationnelleId,
        ...(statut ? { statut } : {}),
      },
      include: {
        realisePar: { include: { entite: true } },
      },
      orderBy: { datePrevue: 'desc' },
    });
    return NextResponse.json(occurrences);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la récupération.' }, { status: 500 });
  }
}
