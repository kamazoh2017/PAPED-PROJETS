import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden } from '@/lib/require-auth';

export async function GET(request: NextRequest) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'projets', 'view')) return forbidden();

  try {
    const acteurs = await prisma.acteurCollectif.findMany({
      orderBy: { libelle: 'asc' },
    });
    return NextResponse.json(acteurs);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'projets', 'create')) return forbidden();

  try {
    const body = await request.json();
    const libelle = String(body.libelle || '').trim();
    if (!libelle) {
      return NextResponse.json({ error: 'Le libellé est obligatoire.' }, { status: 400 });
    }
    const acteur = await prisma.acteurCollectif.create({
      data: {
        libelle,
        description: body.description ? String(body.description).trim() : null,
      },
    });
    return NextResponse.json(acteur, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la création.' }, { status: 500 });
  }
}
