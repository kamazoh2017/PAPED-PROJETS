import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden } from '@/lib/require-auth';

type Params = { params: Promise<{ id: string }> };

const PP_INCLUDE = {
  ressource: {
    include: { entite: true },
  },
  acteurCollectif: true,
} as const;

export async function GET(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'projets', 'view-detail')) return forbidden();

  try {
    const { id } = await params;
    const partiesPrenantes = await prisma.partiePrenante.findMany({
      where: { projetId: id },
      include: PP_INCLUDE,
      orderBy: { role: 'asc' },
    });
    return NextResponse.json(partiesPrenantes);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la récupération.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'detail-projet', 'edit-info')) return forbidden();

  try {
    const { id: projetId } = await params;
    const body = await request.json();

    const typeActeur = String(body.typeActeur || '');
    if (!['ORGANISATIONNEL', 'ACTEUR_COLLECTIF_NON_ORGANISATIONNEL'].includes(typeActeur)) {
      return NextResponse.json({ error: 'typeActeur invalide.' }, { status: 400 });
    }
    if (typeActeur === 'ORGANISATIONNEL' && !body.ressourceId) {
      return NextResponse.json({ error: 'ressourceId requis pour un acteur organisationnel.' }, { status: 400 });
    }
    if (typeActeur === 'ACTEUR_COLLECTIF_NON_ORGANISATIONNEL' && !body.acteurCollectifId) {
      return NextResponse.json({ error: 'acteurCollectifId requis pour un acteur collectif.' }, { status: 400 });
    }
    if (!body.role) {
      return NextResponse.json({ error: 'Le rôle est obligatoire.' }, { status: 400 });
    }

    const pp = await prisma.partiePrenante.create({
      data: {
        projetId,
        typeActeur,
        ressourceId:        typeActeur === 'ORGANISATIONNEL'                         ? String(body.ressourceId)       : null,
        acteurCollectifId:  typeActeur === 'ACTEUR_COLLECTIF_NON_ORGANISATIONNEL'    ? String(body.acteurCollectifId) : null,
        role:                   String(body.role),
        influence:              String(body.influence || 'Moyen'),
        interet:                String(body.interet   || 'Moyen'),
        attentesTexte:          body.attentesTexte          ? String(body.attentesTexte).trim()          : null,
        strategieCommunication: body.strategieCommunication ? String(body.strategieCommunication).trim() : null,
        notes:                  body.notes                  ? String(body.notes).trim()                  : null,
      },
      include: PP_INCLUDE,
    });
    return NextResponse.json(pp, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la création.' }, { status: 500 });
  }
}
