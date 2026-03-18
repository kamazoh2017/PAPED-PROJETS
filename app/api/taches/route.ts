import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

function toOptionalDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET() {
  try {
    const taches = await prisma.tache.findMany({
      include: {
        assigneA: true,
        projet: true,
      },
      orderBy: { dateCreation: 'desc' },
    });
    return NextResponse.json(taches);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des tâches' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body?.projetId || !body?.libelle) {
      return NextResponse.json(
        { error: 'Le projet et le libelle de la tache sont obligatoires.' },
        { status: 400 }
      );
    }

    const projet = await prisma.projet.findUnique({
      where: { id: body.projetId },
      include: { equipeProjet: true },
    });

    if (!projet) {
      return NextResponse.json({ error: 'Projet introuvable.' }, { status: 400 });
    }

    const assigneAId = body.assigneAId || null;
    if (assigneAId) {
      const personne = await prisma.personneRessource.findUnique({
        where: { id: assigneAId },
        select: { id: true },
      });

      if (!personne) {
        return NextResponse.json(
          { error: 'La personne assignee est introuvable.' },
          { status: 400 }
        );
      }
    }

    let statut = body.statut || 'Backlog';

    // Si assigné à quelqu'un, passe à "À faire"
    if (assigneAId && !body.statut) {
      statut = 'A faire';
    }

    const tache = await prisma.tache.create({
      data: {
        projetId: body.projetId,
        libelle: body.libelle,
        description: body.description,
        priorite: body.priorite || 'Moyenne',
        assigneAId,
        statut,
        dateDebutPrevisionnelle: toOptionalDate(body.dateDebutPrevisionnelle),
        dateFinPrevisionnelle: toOptionalDate(body.dateFinPrevisionnelle),
      },
      include: {
        assigneA: true,
        projet: true,
      },
    });

    // Si la personne assignée n'est pas dans l'équipe, l'ajouter
    if (assigneAId) {
      const estDansEquipe = projet.equipeProjet.some((p: { id: string }) => p.id === assigneAId);
      if (!estDansEquipe) {
        await prisma.projet.update({
          where: { id: body.projetId },
          data: {
            equipeProjet: {
              connect: { id: assigneAId },
            },
          },
        });
      }
    }

    return NextResponse.json(tache, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la creation de la tache' },
      { status: 500 }
    );
  }
}
