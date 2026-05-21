import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden, canManageProjet } from '@/lib/require-auth';

type Params = { params: Promise<{ id: string }> };

async function loadResultatProjet(id: string) {
  const r = await prisma.resultatAttendu.findUnique({
    where: { id },
    select: { id: true, projet: { select: { chefProjetId: true } } },
  });
  return r;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'cadre-logique', 'view')) return forbidden();

  const { id } = await params;
  const resultat = await prisma.resultatAttendu.findUnique({
    where: { id },
    include: {
      projet: { select: { id: true, libelle: true } },
      activites: {
        where: { parentActiviteId: null },
        orderBy: [{ ordre: 'asc' }, { code: 'asc' }],
        include: {
          responsable: { select: { id: true, nom: true, prenoms: true } },
          enfants: true,
          _count: { select: { taches: true, enfants: true } },
        },
      },
    },
  });
  if (!resultat) return NextResponse.json({ error: 'Résultat introuvable.' }, { status: 404 });
  return NextResponse.json(resultat);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'cadre-logique', 'update')) return forbidden();

  const { id } = await params;
  const ref = await loadResultatProjet(id);
  if (!ref) return NextResponse.json({ error: 'Résultat introuvable.' }, { status: 404 });
  if (!canManageProjet(user, ref.projet.chefProjetId)) return forbidden();

  try {
    const body = await request.json();
    const code = body.code !== undefined ? String(body.code).trim() : undefined;
    const libelle = body.libelle !== undefined ? String(body.libelle).trim() : undefined;

    if (code === '') return NextResponse.json({ error: 'Code obligatoire.' }, { status: 400 });
    if (libelle === '') return NextResponse.json({ error: 'Libellé obligatoire.' }, { status: 400 });

    const resultat = await prisma.resultatAttendu.update({
      where: { id },
      data: {
        code,
        libelle,
        description: body.description !== undefined ? (body.description ? String(body.description).trim() : null) : undefined,
        ordre: body.ordre !== undefined ? Number(body.ordre) : undefined,
      },
    });
    return NextResponse.json(resultat);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la modification.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'cadre-logique', 'delete')) return forbidden();

  const { id } = await params;
  const ref = await loadResultatProjet(id);
  if (!ref) return NextResponse.json({ error: 'Résultat introuvable.' }, { status: 404 });
  if (!canManageProjet(user, ref.projet.chefProjetId)) return forbidden();

  const count = await prisma.activite.count({ where: { resultatId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: `Impossible de supprimer : ${count} activité(s) rattachée(s). Supprimez-les d'abord.` },
      { status: 409 },
    );
  }
  await prisma.resultatAttendu.delete({ where: { id } });
  return NextResponse.json({ message: 'Résultat supprimé.' });
}
