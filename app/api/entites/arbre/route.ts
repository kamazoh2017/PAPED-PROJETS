import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden } from '@/lib/require-auth';

// Nœud de l'arbre retourné au client
type EntiteNoeud = {
  id: string;
  libelle: string;
  tutelle: string | null;
  typeEntite: string | null;
  parentId: string | null;
  nbPersonnes: number;
  enfants: EntiteNoeud[];
};

function construireArbre(entites: any[], parentId: string | null): EntiteNoeud[] {
  return entites
    .filter(e => e.parentId === parentId)
    .map(e => ({
      id: e.id,
      libelle: e.libelle,
      tutelle: e.tutelle,
      typeEntite: e.typeEntite,
      parentId: e.parentId,
      nbPersonnes: e._count.personnesRessources,
      enfants: construireArbre(entites, e.id),
    }));
}

export async function GET(request: NextRequest) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'entites', 'view')) return forbidden();

  try {
    const entites = await prisma.entite.findMany({
      select: {
        id: true,
        libelle: true,
        tutelle: true,
        typeEntite: true,
        parentId: true,
        _count: { select: { personnesRessources: true } },
      },
      orderBy: { libelle: 'asc' },
    });

    const arbre = construireArbre(entites, null);
    return NextResponse.json(arbre);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la construction de l\'arbre.' }, { status: 500 });
  }
}
