import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden, canManageProjet } from '@/lib/require-auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'cadre-logique', 'view')) return forbidden();

  const { id: projetId } = await params;

  const resultats = await prisma.resultatAttendu.findMany({
    where: { projetId },
    orderBy: [{ ordre: 'asc' }, { code: 'asc' }],
    include: {
      activites: {
        where: { parentActiviteId: null },  // uniquement les activités racines
        orderBy: [{ ordre: 'asc' }, { code: 'asc' }],
        include: {
          responsable: { select: { id: true, nom: true, prenoms: true } },
          enfants: {
            orderBy: [{ ordre: 'asc' }, { code: 'asc' }],
            include: {
              responsable: { select: { id: true, nom: true, prenoms: true } },
              _count: { select: { taches: true, enfants: true } },
            },
          },
          _count: { select: { taches: true, enfants: true } },
        },
      },
    },
  });
  return NextResponse.json(resultats);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'cadre-logique', 'create')) return forbidden();

  const { id: projetId } = await params;

  // Vérification contextuelle : chef projet OU COORDINATEUR+
  const projet = await prisma.projet.findUnique({ where: { id: projetId }, select: { chefProjetId: true } });
  if (!projet) return NextResponse.json({ error: 'Projet introuvable.' }, { status: 404 });
  if (!canManageProjet(user, projet.chefProjetId)) return forbidden();

  try {
    const body = await request.json();
    const code = String(body.code || '').trim();
    const libelle = String(body.libelle || '').trim();
    if (!code || !libelle) {
      return NextResponse.json({ error: 'Code et libellé obligatoires.' }, { status: 400 });
    }

    const conflict = await prisma.resultatAttendu.findUnique({
      where: { projetId_code: { projetId, code } },
      select: { id: true },
    });
    if (conflict) {
      return NextResponse.json({ error: `Le code "${code}" existe déjà pour ce projet.` }, { status: 409 });
    }

    const resultat = await prisma.resultatAttendu.create({
      data: {
        projetId,
        code,
        libelle,
        description: body.description ? String(body.description).trim() : null,
        ordre: body.ordre != null ? Number(body.ordre) : 0,
      },
    });
    return NextResponse.json(resultat, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la création du résultat.' }, { status: 500 });
  }
}
