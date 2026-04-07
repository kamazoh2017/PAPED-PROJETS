import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, forbidden, canManageProjet } from '@/lib/require-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  // Tous les rôles peuvent consulter un projet (canDo 'projets:view-detail' accordé à tous)

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
            ressource: { include: { entite: true } },
            acteurCollectif: true,
          },
          orderBy: { role: 'asc' },
        },
        risques: true,
        entitePorteuse: true,
      },
    });

    if (!projet) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    return NextResponse.json(projet);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la récupération du projet' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, err } = await requireAuth(request);
  if (err) return err;

  try {
    const { id } = await params;

    // Charger le projet pour vérifier le chef (nécessaire pour le contrôle contextuel)
    const existing = await prisma.projet.findUnique({
      where: { id },
      select: {
        chefProjetId: true,
        dateDebutEffective: true,
        dateFinEffective: true,
        statut: true,
        equipeProjet: { select: { id: true } },
      },
    });
    if (!existing) return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });

    // COORDINATEUR+ OU chef de projet du projet concerné
    if (!canManageProjet(user, existing.chefProjetId)) return forbidden();

    const body = await request.json();

    function toOptDate(val: unknown): Date | null | undefined {
      if (val === undefined) return undefined;
      if (val === null || val === '') return null;
      const d = new Date(String(val));
      return Number.isNaN(d.getTime()) ? null : d;
    }

    const updates: Record<string, unknown> = {
      libelle:                  body.libelle,
      description:              body.description,
      statut:                   body.statut,
      chefProjetId:             body.chefProjetId,
      entiteId:                 body.entiteId !== undefined ? (body.entiteId || null) : undefined,
      dateDebutPrevisionnelle:  toOptDate(body.dateDebutPrevisionnelle),
      dateFinPrevisionnelle:    toOptDate(body.dateFinPrevisionnelle),
      dateDebutEffective:       toOptDate(body.dateDebutEffective),
      dateFinEffective:         toOptDate(body.dateFinEffective),
    };

    // Auto-fill dates effectives selon statut
    if (body.statut === 'En cours' && body.dateDebutEffective === undefined) {
      if (!existing.dateDebutEffective) updates.dateDebutEffective = new Date();
    }
    if ((body.statut === 'Terminé' || body.statut === 'Clôturé') && body.dateFinEffective === undefined) {
      if (!existing.dateFinEffective) updates.dateFinEffective = new Date();
    }

    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

    // Si le chef de projet change, s'assurer qu'il est dans l'équipe
    if (body.chefProjetId) {
      const dejaDansEquipe = existing.equipeProjet.some(m => m.id === body.chefProjetId);
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
        entitePorteuse: true,
      },
    });
    return NextResponse.json(projet);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du projet' }, { status: 500 });
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

    const projet = await prisma.projet.findUnique({
      where: { id },
      select: { chefProjetId: true },
    });
    if (!projet) return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });

    // COORDINATEUR+ OU chef de projet
    if (!canManageProjet(user, projet.chefProjetId)) return forbidden();

    await prisma.projet.delete({ where: { id } });
    return NextResponse.json({ message: 'Projet supprimé' });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la suppression du projet' }, { status: 500 });
  }
}
