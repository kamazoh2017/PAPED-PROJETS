import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden } from '@/lib/require-auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'entites', 'view')) return forbidden();

  try {
    const { id } = await params;
    const enfants = await prisma.entite.findMany({
      where: { parentId: id },
      include: {
        _count: { select: { personnesRessources: true, enfants: true } },
      },
      orderBy: { libelle: 'asc' },
    });
    return NextResponse.json(enfants);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la récupération des enfants.' }, { status: 500 });
  }
}
