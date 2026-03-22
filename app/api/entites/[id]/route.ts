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
    const entite = await prisma.entite.findUnique({
      where: { id },
      include: { personnesRessources: true, partiesPrenantes: true },
    });
    if (!entite) return NextResponse.json({ error: 'Entité introuvable.' }, { status: 404 });
    return NextResponse.json(entite);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la récupération.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'entites', 'update')) return forbidden();

  try {
    const { id } = await params;
    const body = await request.json();
    const libelle = String(body.libelle || '').trim();
    if (!libelle) {
      return NextResponse.json({ error: 'Le libellé est obligatoire.' }, { status: 400 });
    }
    const conflict = await prisma.entite.findFirst({
      where: { id: { not: id }, libelle },
      select: { id: true },
    });
    if (conflict) {
      return NextResponse.json({ error: 'Une entité avec ce libellé existe déjà.' }, { status: 409 });
    }
    const entite = await prisma.entite.update({
      where: { id },
      data: { libelle, tutelle: body.tutelle ? String(body.tutelle).trim() : null },
      include: { personnesRessources: true, partiesPrenantes: true },
    });
    return NextResponse.json(entite);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la modification.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'entites', 'delete')) return forbidden();

  try {
    const { id } = await params;
    const entite = await prisma.entite.findUnique({
      where: { id },
      select: { _count: { select: { personnesRessources: true } } },
    });
    if (entite?._count.personnesRessources) {
      return NextResponse.json(
        { error: 'Impossible de supprimer : des personnes ressources sont rattachées à cette entité.' },
        { status: 409 }
      );
    }
    await prisma.entite.delete({ where: { id } });
    return NextResponse.json({ message: 'Entité supprimée.' });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 });
  }
}
