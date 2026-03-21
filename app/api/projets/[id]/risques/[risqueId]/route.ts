import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

const GRAVITES_VALIDES = ['Faible', 'Moyen', 'Élevé', 'Critique'];

function couleurFromGravite(gravite: string): string {
  if (gravite === 'Moyen') return 'Jaune';
  if (gravite === 'Élevé') return 'Orange';
  if (gravite === 'Critique') return 'Rouge';
  return 'Vert';
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; risqueId: string }> }
) {
  try {
    const { risqueId } = await params;
    const body = await request.json();

    const taux = body.taux !== undefined ? Number(body.taux) : undefined;
    if (taux !== undefined && (Number.isNaN(taux) || taux < 0 || taux > 100)) {
      return NextResponse.json({ error: 'Taux doit être entre 0 et 100.' }, { status: 400 });
    }
    if (body.gravite && !GRAVITES_VALIDES.includes(body.gravite)) {
      return NextResponse.json({ error: 'Gravité invalide.' }, { status: 400 });
    }

    const risque = await prisma.risqueProjet.update({
      where: { id: risqueId },
      data: {
        taux: taux ?? undefined,
        gravite: body.gravite ?? undefined,
        couleur: body.gravite ? couleurFromGravite(body.gravite) : undefined,
      },
    });
    return NextResponse.json(risque);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du risque' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; risqueId: string }> }
) {
  try {
    const { risqueId } = await params;
    await prisma.risqueProjet.delete({ where: { id: risqueId } });
    return NextResponse.json({ message: 'Risque supprimé' });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la suppression du risque' }, { status: 500 });
  }
}
