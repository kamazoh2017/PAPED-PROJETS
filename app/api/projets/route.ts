import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const projets = await prisma.projet.findMany({
      include: {
        chefProjet: true,
        equipeProjet: true,
        taches: true,
      },
      orderBy: { dateCreation: 'desc' },
    });
    return NextResponse.json(projets);
  } catch (error) {
    console.error('API /api/projets GET failed:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body?.libelle || !body?.chefProjetId) {
      return NextResponse.json(
        { error: 'Le libelle du projet et le chef de projet sont obligatoires.' },
        { status: 400 }
      );
    }

    const chef = await prisma.personneRessource.findUnique({
      where: { id: body.chefProjetId },
      select: { id: true },
    });

    if (!chef) {
      return NextResponse.json(
        { error: 'Le chef de projet selectionne est introuvable.' },
        { status: 400 }
      );
    }

    const projet = await prisma.projet.create({
      data: {
        libelle: body.libelle,
        description: body.description,
        statut: body.statut || 'Demarrage',
        chefProjetId: body.chefProjetId,
        dateDebutPrevisionnelle: body.dateDebutPrevisionnelle ? new Date(body.dateDebutPrevisionnelle) : null,
        dateFinPrevisionnelle: body.dateFinPrevisionnelle ? new Date(body.dateFinPrevisionnelle) : null,
        equipeProjet: {
          connect: { id: body.chefProjetId },
        },
      },
      include: {
        chefProjet: true,
        equipeProjet: true,
        taches: true,
      },
    });
    return NextResponse.json(projet, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la creation du projet' },
      { status: 500 }
    );
  }
}
