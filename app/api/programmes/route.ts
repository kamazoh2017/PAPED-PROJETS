import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden } from '@/lib/require-auth';

export async function GET(request: NextRequest) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'programmes', 'view')) return forbidden();

  const url = new URL(request.url);
  const statut = url.searchParams.get('statut');

  const where: Record<string, unknown> = {};
  if (statut) where.statut = statut;

  const programmes = await prisma.programme.findMany({
    where,
    include: {
      entite: { select: { id: true, libelle: true, typeEntite: true } },
      _count: { select: { projets: true } },
    },
    orderBy: { libelle: 'asc' },
  });
  return NextResponse.json(programmes);
}

function parseDate(v: unknown): Date | null {
  if (v === null || v === undefined || v === '') return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(request: NextRequest) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'programmes', 'create')) return forbidden();

  try {
    const body = await request.json();
    const libelle = String(body.libelle || '').trim();
    if (!libelle) {
      return NextResponse.json({ error: 'Le libellé est obligatoire.' }, { status: 400 });
    }

    const conflict = await prisma.programme.findFirst({ where: { libelle }, select: { id: true } });
    if (conflict) {
      return NextResponse.json({ error: 'Un programme avec ce libellé existe déjà.' }, { status: 409 });
    }

    const code = body.code ? String(body.code).trim() : null;
    if (code) {
      const codeConflict = await prisma.programme.findFirst({ where: { code }, select: { id: true } });
      if (codeConflict) {
        return NextResponse.json({ error: 'Un programme avec ce code existe déjà.' }, { status: 409 });
      }
    }

    const programme = await prisma.programme.create({
      data: {
        libelle,
        code,
        description: body.description ? String(body.description).trim() : null,
        bailleur:    body.bailleur ? String(body.bailleur).trim() : null,
        dateDebut:   parseDate(body.dateDebut),
        dateFin:     parseDate(body.dateFin),
        budgetTotal: body.budgetTotal != null && body.budgetTotal !== '' ? Number(body.budgetTotal) : null,
        devise:      body.devise ? String(body.devise).trim() : 'XOF',
        statut:      body.statut ? String(body.statut).trim() : 'Actif',
        entiteId:    body.entiteId ? String(body.entiteId) : null,
      },
      include: {
        entite: { select: { id: true, libelle: true, typeEntite: true } },
        _count: { select: { projets: true } },
      },
    });
    return NextResponse.json(programme, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la création du programme.' }, { status: 500 });
  }
}
