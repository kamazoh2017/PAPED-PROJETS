import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden, canManageProjet } from '@/lib/require-auth';

type Params = { params: Promise<{ id: string }> };

function parseDate(v: unknown): Date | null {
  if (v === null || v === undefined || v === '') return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'cadre-logique', 'create')) return forbidden();

  const { id: resultatId } = await params;

  const ref = await prisma.resultatAttendu.findUnique({
    where: { id: resultatId },
    select: { projet: { select: { chefProjetId: true } } },
  });
  if (!ref) return NextResponse.json({ error: 'Résultat introuvable.' }, { status: 404 });
  if (!canManageProjet(user, ref.projet.chefProjetId)) return forbidden();

  try {
    const body = await request.json();
    const code = String(body.code || '').trim();
    const libelle = String(body.libelle || '').trim();
    if (!code || !libelle) {
      return NextResponse.json({ error: 'Code et libellé obligatoires.' }, { status: 400 });
    }

    const conflict = await prisma.activite.findUnique({
      where: { resultatId_code: { resultatId, code } },
      select: { id: true },
    });
    if (conflict) {
      return NextResponse.json({ error: `Le code "${code}" existe déjà pour ce résultat.` }, { status: 409 });
    }

    const activite = await prisma.activite.create({
      data: {
        resultatId,
        parentActiviteId: body.parentActiviteId ? String(body.parentActiviteId) : null,
        code,
        libelle,
        description:   body.description ? String(body.description).trim() : null,
        responsableId: body.responsableId ? String(body.responsableId) : null,
        dateDebutPrev: parseDate(body.dateDebutPrev),
        dateFinPrev:   parseDate(body.dateFinPrev),
        statut:        body.statut ? String(body.statut).trim() : 'Planifiée',
        ordre:         body.ordre != null ? Number(body.ordre) : 0,
      },
      include: { responsable: { select: { id: true, nom: true, prenoms: true } } },
    });
    return NextResponse.json(activite, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la création de l\'activité.' }, { status: 500 });
  }
}
