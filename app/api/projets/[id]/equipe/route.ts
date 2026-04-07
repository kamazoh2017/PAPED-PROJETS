import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, forbidden, canManageProjet } from '@/lib/require-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, err } = await requireAuth(request);
  if (err) return err;

  try {
    const { id } = await params;
    const body = await request.json();

    if (!body?.membreId) {
      return NextResponse.json({ error: 'membreId est obligatoire.' }, { status: 400 });
    }

    const projet = await prisma.projet.findUnique({
      where: { id },
      select: { chefProjetId: true },
    });
    if (!projet) return NextResponse.json({ error: 'Projet introuvable.' }, { status: 404 });

    // COORDINATEUR+ OU chef de projet
    if (!canManageProjet(user, projet.chefProjetId)) return forbidden();

    const updated = await prisma.projet.update({
      where: { id },
      data: { equipeProjet: { connect: { id: body.membreId } } },
      include: { equipeProjet: { include: { entite: true } } },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'ajout du membre" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, err } = await requireAuth(request);
  if (err) return err;

  try {
    const { id } = await params;
    const body = await request.json();

    if (!body?.membreId) {
      return NextResponse.json({ error: 'membreId est obligatoire.' }, { status: 400 });
    }

    const projet = await prisma.projet.findUnique({
      where: { id },
      select: { chefProjetId: true },
    });
    if (!projet) return NextResponse.json({ error: 'Projet introuvable.' }, { status: 404 });

    // COORDINATEUR+ OU chef de projet
    if (!canManageProjet(user, projet.chefProjetId)) return forbidden();

    const updated = await prisma.projet.update({
      where: { id },
      data: { equipeProjet: { disconnect: { id: body.membreId } } },
      include: { equipeProjet: { include: { entite: true } } },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Erreur lors du retrait du membre' }, { status: 500 });
  }
}
