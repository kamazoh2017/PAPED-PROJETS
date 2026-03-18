import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projet = await prisma.projet.findUnique({
      where: { id: params.id },
      include: {
        chefProjet: true,
        equipeProjet: true,
        taches: {
          include: {
            assigneA: true,
          },
          orderBy: { ordre: 'asc' },
        },
        partiesPrenantes: {
          include: {
            partiePrenante: true,
          },
        },
      },
    });

    if (!projet) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    return NextResponse.json(projet);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération du projet' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const projet = await prisma.projet.update({
      where: { id: params.id },
      data: {
        libelle: body.libelle,
        description: body.description,
        statut: body.statut,
        chefProjetId: body.chefProjetId,
      },
      include: {
        chefProjet: true,
        equipeProjet: true,
        taches: true,
      },
    });
    return NextResponse.json(projet);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du projet' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.projet.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: 'Projet supprimé' });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression du projet' }, { status: 500 });
  }
}
