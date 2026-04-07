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
  if (!canDo(user, 'personnes', 'view')) return forbidden();

  try {
    const personnes = await prisma.personneRessource.findMany({
      include: { entite: true },
    });
    return NextResponse.json(personnes);
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

    const nom      = String(body.nom      || '').trim();
    const prenoms  = String(body.prenoms  || '').trim();
    const email    = String(body.email    || '').trim().toLowerCase();
    const fonction = String(body.fonction || '').trim();
    const entiteId = String(body.entiteId || '').trim();
    const telephone = String(body.telephone || '').replace(/\D/g, '');

    if (!nom || !prenoms || !email || !fonction || !entiteId) {
      return NextResponse.json({ error: 'Tous les champs obligatoires doivent etre renseignes.' }, { status: 400 });
    }
    if (telephone.length !== 10) {
      return NextResponse.json({ error: 'Le numero de telephone doit contenir exactement 10 chiffres.' }, { status: 400 });
    }

    const existing = await prisma.personneRessource.findFirst({
      where: { OR: [{ email }, { telephone }] },
      select: { id: true, email: true, telephone: true },
    });
    if (existing) {
      if (existing.email === email) {
        return NextResponse.json({ error: 'Une ressource existe deja avec cet email.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Une ressource existe deja avec ce numero de telephone.' }, { status: 409 });
    }

    const personne = await prisma.personneRessource.create({
      data: { nom, prenoms, telephone, email, fonction, entiteId, estChefProjet: body.estChefProjet || false },
      include: { entite: true },
    });
    return NextResponse.json(personne, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la création de la personne' }, { status: 500 });
  }
}
