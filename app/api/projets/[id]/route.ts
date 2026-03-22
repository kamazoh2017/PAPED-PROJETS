import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden } from '@/lib/require-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'projets', 'view-detail')) return forbidden();

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
        risques: true,
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
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'detail-projet', 'edit-info')) return forbidden();

  try {
    const { id } = await params;
    const body = await request.json();

    function toOptDate(val: unknown): Date | null | undefined {
      if (val === undefined) return undefined;
      if (val === null || val === '') return null;
      const d = new Date(String(val));
      return Number.isNaN(d.getTime()) ? null : d;
    }

    const updates: Record<string, unknown> = {
      libelle: body.libelle,
      description: body.description,
      statut: body.statut,
      chefProjetId: body.chefProjetId,
      dateDebutPrevisionnelle: toOptDate(body.dateDebutPrevisionnelle),
      dateFinPrevisionnelle: toOptDate(body.dateFinPrevisionnelle),
      dateDebutEffective: toOptDate(body.dateDebutEffective),
      dateFinEffective: toOptDate(body.dateFinEffective),
    };

    // Auto-fill dates effectives selon le statut
    if (body.statut === 'En cours' && body.dateDebutEffective === undefined) {
      const existing = await prisma.projet.findUnique({ where: { id }, select: { dateDebutEffective: true } });
      if (!existing?.dateDebutEffective) updates.dateDebutEffective = new Date();
    }
    if ((body.statut === 'Terminé' || body.statut === 'Clôturé') && body.dateFinEffective === undefined) {
      const existing = await prisma.projet.findUnique({ where: { id }, select: { dateFinEffective: true } });
      if (!existing?.dateFinEffective) updates.dateFinEffective = new Date();
    }

    // Nettoyage des undefined pour Prisma
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

    // Si le chef de projet change, s'assurer qu'il est dans l'équipe
    if (body.chefProjetId) {
      const existing = await prisma.projet.findUnique({
        where: { id },
        select: { equipeProjet: { select: { id: true } } },
      });
      const dejaDansEquipe = existing?.equipeProjet.some(m => m.id === body.chefProjetId);
      if (!dejaDansEquipe) {
        (updates as any).equipeProjet = { connect: { id: body.chefProjetId } };
      }
    }

    const projet = await prisma.projet.update({
      where: { id },
      data: updates as any,
      include: {
        chefProjet: { include: { entite: true } },
        equipeProjet: { include: { entite: true } },
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'detail-projet', 'delete')) return forbidden();

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
