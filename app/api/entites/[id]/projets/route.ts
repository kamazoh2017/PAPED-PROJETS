import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden } from '@/lib/require-auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'entites', 'view')) return forbidden();

  try {
    const { id } = await params;
    // Le lien Projet ↔ Entite passe par PartiePrenante, pas par une FK directe
    // On retourne les projets dont une partie prenante est liée à cette entité
    const projets = await prisma.projet.findMany({
      where: {
        OR: [
          { entiteId: id },
          { partiesPrenantes: { some: { ressource: { entiteId: id } } } },
        ],
      },
      select: {
        id: true,
        libelle: true,
        statut: true,
        etatAvancement: true,
        tauxAvancementReel: true,
        dateDebutPrevisionnelle: true,
        dateFinPrevisionnelle: true,
        chefProjet: { select: { id: true, nom: true, prenoms: true } },
      },
      orderBy: { dateCreation: 'desc' },
    });
    return NextResponse.json(projets);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la récupération des projets.' }, { status: 500 });
  }
}
