import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden, hasRoleAtLeast } from '@/lib/require-auth';

type Params = { params: Promise<{ id: string }> };

/** Vérifie si l'utilisateur est chef d'au moins un projet (pour AGENT). */
async function isChefDeAuMoinsUnProjet(personneId: string | null | undefined): Promise<boolean> {
  if (!personneId) return false;
  const count = await prisma.projet.count({ where: { chefProjetId: personneId } });
  return count > 0;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'personnes', 'view')) return forbidden();

  try {
    const { id } = await params;
    const personne = await prisma.personneRessource.findUnique({
      where: { id },
      include: { entite: true },
    });
    if (!personne) return NextResponse.json({ error: 'Personne introuvable.' }, { status: 404 });
    return NextResponse.json(personne);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la récupération.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;

  // GESTIONNAIRE+ (statique) OU agent chef d'au moins un projet (contextuel)
  if (!hasRoleAtLeast(user, 'GESTIONNAIRE')) {
    const estChef = await isChefDeAuMoinsUnProjet(user.personne?.id);
    if (!estChef) return forbidden();
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const nom      = String(body.nom      || '').trim();
    const prenoms  = String(body.prenoms  || '').trim();
    const email    = String(body.email    || '').trim().toLowerCase();
    const fonction = String(body.fonction || '').trim();
    const entiteId = String(body.entiteId || '').trim();
    const telephone = body.telephone ? String(body.telephone).replace(/\D/g, '') : undefined;

    if (!nom || !prenoms || !email || !fonction || !entiteId) {
      return NextResponse.json({ error: 'Tous les champs obligatoires doivent être renseignés.' }, { status: 400 });
    }
    if (telephone !== undefined && telephone.length !== 10) {
      return NextResponse.json({ error: 'Le numéro de téléphone doit contenir exactement 10 chiffres.' }, { status: 400 });
    }

    const conflict = await prisma.personneRessource.findFirst({
      where: { id: { not: id }, OR: [{ email }, ...(telephone ? [{ telephone }] : [])] },
      select: { id: true, email: true, telephone: true },
    });
    if (conflict) {
      if (conflict.email === email) {
        return NextResponse.json({ error: 'Une ressource existe déjà avec cet email.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Une ressource existe déjà avec ce numéro de téléphone.' }, { status: 409 });
    }

    const data: Record<string, unknown> = { nom, prenoms, email, fonction, entiteId };
    if (telephone !== undefined) data.telephone = telephone;
    if (body.estChefProjet !== undefined) data.estChefProjet = Boolean(body.estChefProjet);

    const personne = await prisma.personneRessource.update({
      where: { id },
      data,
      include: { entite: true },
    });
    return NextResponse.json(personne);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la modification.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;

  // GESTIONNAIRE+ (statique) OU agent chef d'au moins un projet (contextuel)
  if (!hasRoleAtLeast(user, 'GESTIONNAIRE')) {
    const estChef = await isChefDeAuMoinsUnProjet(user.personne?.id);
    if (!estChef) return forbidden();
  }

  try {
    const { id } = await params;
    await prisma.personneRessource.delete({ where: { id } });
    return NextResponse.json({ message: 'Personne supprimée.' });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 });
  }
}
