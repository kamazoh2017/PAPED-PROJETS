import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden } from '@/lib/require-auth';

type Params = { params: Promise<{ id: string }> };

function parseDate(v: unknown): Date | null {
  if (v === null || v === undefined || v === '') return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'programmes', 'view')) return forbidden();

  const { id } = await params;
  const programme = await prisma.programme.findUnique({
    where: { id },
    include: {
      entite: { select: { id: true, libelle: true, typeEntite: true } },
      projets: {
        select: {
          id: true, libelle: true, statut: true, etatAvancement: true,
          tauxAvancementReel: true, tauxAchevementReel: true,
          chefProjet: { select: { id: true, nom: true, prenoms: true } },
        },
        orderBy: { libelle: 'asc' },
      },
    },
  });
  if (!programme) return NextResponse.json({ error: 'Programme introuvable.' }, { status: 404 });
  return NextResponse.json(programme);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'programmes', 'update')) return forbidden();

  try {
    const { id } = await params;
    const body = await request.json();
    const libelle = String(body.libelle || '').trim();
    if (!libelle) {
      return NextResponse.json({ error: 'Le libellé est obligatoire.' }, { status: 400 });
    }

    const conflict = await prisma.programme.findFirst({
      where: { id: { not: id }, libelle }, select: { id: true },
    });
    if (conflict) {
      return NextResponse.json({ error: 'Un programme avec ce libellé existe déjà.' }, { status: 409 });
    }

    const code = body.code !== undefined ? (body.code ? String(body.code).trim() : null) : undefined;
    if (code) {
      const codeConflict = await prisma.programme.findFirst({
        where: { id: { not: id }, code }, select: { id: true },
      });
      if (codeConflict) {
        return NextResponse.json({ error: 'Un programme avec ce code existe déjà.' }, { status: 409 });
      }
    }

    const programme = await prisma.programme.update({
      where: { id },
      data: {
        libelle,
        code,
        description: body.description !== undefined ? (body.description ? String(body.description).trim() : null) : undefined,
        bailleur:    body.bailleur !== undefined ? (body.bailleur ? String(body.bailleur).trim() : null) : undefined,
        dateDebut:   body.dateDebut !== undefined ? parseDate(body.dateDebut) : undefined,
        dateFin:     body.dateFin !== undefined ? parseDate(body.dateFin) : undefined,
        budgetTotal: body.budgetTotal !== undefined ? (body.budgetTotal !== '' && body.budgetTotal !== null ? Number(body.budgetTotal) : null) : undefined,
        devise:      body.devise !== undefined ? (body.devise ? String(body.devise).trim() : 'XOF') : undefined,
        statut:      body.statut !== undefined ? String(body.statut).trim() : undefined,
        entiteId:    body.entiteId !== undefined ? (body.entiteId ? String(body.entiteId) : null) : undefined,
      },
      include: {
        entite: { select: { id: true, libelle: true, typeEntite: true } },
        _count: { select: { projets: true } },
      },
    });
    return NextResponse.json(programme);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la modification.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'programmes', 'delete')) return forbidden();

  try {
    const { id } = await params;
    const programme = await prisma.programme.findUnique({
      where: { id },
      select: { _count: { select: { projets: true } } },
    });
    if (!programme) return NextResponse.json({ error: 'Programme introuvable.' }, { status: 404 });
    if (programme._count.projets > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer : ${programme._count.projets} projet(s) rattaché(s). Détachez-les ou archivez le programme.` },
        { status: 409 },
      );
    }
    await prisma.programme.delete({ where: { id } });
    return NextResponse.json({ message: 'Programme supprimé.' });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 });
  }
}
