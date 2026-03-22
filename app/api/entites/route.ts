import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden } from '@/lib/require-auth';

export async function GET(request: NextRequest) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'entites', 'view')) return forbidden();

  try {
    const entites = await prisma.entite.findMany({
      include: { personnesRessources: true, partiesPrenantes: true },
    });
    return NextResponse.json(entites);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'entites', 'create')) return forbidden();

  try {
    const body = await request.json();
    const libelle = String(body.libelle || '').trim();
    if (!libelle) return NextResponse.json({ error: 'Le libellé est obligatoire.' }, { status: 400 });

    const entite = await prisma.entite.create({
      data: { libelle, tutelle: body.tutelle ? String(body.tutelle).trim() : null },
      include: { personnesRessources: true, partiesPrenantes: true },
    });
    return NextResponse.json(entite, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la création de l'entité" }, { status: 500 });
  }
}
