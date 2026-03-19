import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projet = await prisma.projet.findUnique({
      where: { id },
      include: {
        chefProjet: { include: { entite: true } },
        equipeProjet: { include: { entite: true } },
        taches: {
          include: {
            assigneA: { include: { entite: true } },
          },
          orderBy: { ordre: 'asc' },
        },
        partiesPrenantes: {
          include: {
            partiePrenante: {
              include: {
                entite: true,
                responsable: true,
              },
            },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const projet = await prisma.projet.update({
      where: { id },
      data: {
        libelle: body.libelle,
        description: body.description,
        statut: body.statut,
        chefProjetId: body.chefProjetId,
        dateDebutPrevisionnelle: body.dateDebutPrevisionnelle !== undefined
          ? (body.dateDebutPrevisionnelle ? new Date(body.dateDebutPrevisionnelle) : null)
          : undefined,
        dateFinPrevisionnelle: body.dateFinPrevisionnelle !== undefined
          ? (body.dateFinPrevisionnelle ? new Date(body.dateFinPrevisionnelle) : null)
          : undefined,
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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.projet.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Projet supprimé' });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression du projet' }, { status: 500 });
  }
}
