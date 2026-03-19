import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

function toOptionalDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updates: any = {
      libelle: body.libelle,
      description: body.description,
      priorite: body.priorite,
      assigneAId: body.assigneAId,
      statut: body.statut,
      dateDebutPrevisionnelle: toOptionalDate(body.dateDebutPrevisionnelle),
      dateFinPrevisionnelle: toOptionalDate(body.dateFinPrevisionnelle),
    };

    // Remplir automatiquement les dates effectives
    if (body.statut === 'En cours' && body.dateDebutEffective === undefined) {
      updates.dateDebutEffective = new Date();
    }
    if (body.statut === 'Terminé' && body.dateFinEffective === undefined) {
      updates.dateFinEffective = new Date();
    }

    const tache = await prisma.tache.update({
      where: { id },
      data: updates,
      include: {
        assigneA: true,
        projet: true,
      },
    });

    // Si assignée à une nouvelle personne, l'ajouter à l'équipe
    if (body.assigneAId) {
      const projet = await prisma.projet.findUnique({
        where: { id: tache.projetId },
        include: { equipeProjet: true },
      });

      const estDansEquipe = projet?.equipeProjet.some((p) => p.id === body.assigneAId);
      if (!estDansEquipe) {
        await prisma.projet.update({
          where: { id: tache.projetId },
          data: {
            equipeProjet: {
              connect: { id: body.assigneAId },
            },
          },
        });
      }
    }

    return NextResponse.json(tache);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la tâche' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.tache.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Tâche supprimée' });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression de la tâche' }, { status: 500 });
  }
}
