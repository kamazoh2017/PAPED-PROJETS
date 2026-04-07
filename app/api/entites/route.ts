import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden, hasRoleAtLeast } from '@/lib/require-auth';

/** Vérifie si l'utilisateur est chef d'au moins un projet (pour AGENT). */
async function isChefDeAuMoinsUnProjet(personneId: string | null | undefined): Promise<boolean> {
  if (!personneId) return false;
  const count = await prisma.projet.count({ where: { chefProjetId: personneId } });
  return count > 0;
}

export async function GET(request: NextRequest) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'entites', 'view')) return forbidden();

  try {
    const entites = await prisma.entite.findMany({
      include: { personnesRessources: true, parent: true, _count: { select: { enfants: true } } },
      orderBy: { libelle: 'asc' },
    });
    return NextResponse.json(entites);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const { user, err } = await requireAuth(request);
  if (err) return err;

  // GESTIONNAIRE+ (statique) OU agent chef d'au moins un projet (contextuel)
  if (!hasRoleAtLeast(user, 'GESTIONNAIRE')) {
    const estChef = await isChefDeAuMoinsUnProjet(user.personne?.id);
    if (!estChef) return forbidden();
  }

  try {
    const body = await request.json();
    const libelle = String(body.libelle || '').trim();
    if (!libelle) return NextResponse.json({ error: 'Le libellé est obligatoire.' }, { status: 400 });

    const entite = await prisma.entite.create({
      data: {
        libelle,
        tutelle:    body.tutelle    ? String(body.tutelle).trim()    : null,
        typeEntite: body.typeEntite ? String(body.typeEntite).trim() : null,
        parentId:   body.parentId   ? String(body.parentId)         : null,
      },
      include: { personnesRessources: true, parent: true },
    });
    return NextResponse.json(entite, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur lors de la création de l'entité" }, { status: 500 });
  }
}
