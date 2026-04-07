import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden } from '@/lib/require-auth';

type Params = { params: Promise<{ id: string }> };

const OP_INCLUDE = {
  entite:       true,
  responsable:  { include: { entite: true } },
  projetSource: { select: { id: true, libelle: true } },
  taches: {
    include: {
      responsable: { include: { entite: true } },
      entite: true,
      _count: { select: { occurrences: true } },
    },
    orderBy: { libelle: 'asc' as const },
  },
} as const;

export async function GET(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'operations', 'view')) return forbidden();

  try {
    const { id } = await params;
    const operation = await prisma.operation.findUnique({
      where: { id },
      include: OP_INCLUDE,
    });
    if (!operation) return NextResponse.json({ error: 'Opération non trouvée.' }, { status: 404 });
    return NextResponse.json(operation);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la récupération.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'operations', 'update')) return forbidden();

  try {
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.libelle        !== undefined) data.libelle        = String(body.libelle).trim();
    if (body.description    !== undefined) data.description    = body.description    ? String(body.description).trim()    : null;
    if (body.statut         !== undefined) data.statut         = String(body.statut);
    if (body.entiteId       !== undefined) data.entiteId       = body.entiteId       ? String(body.entiteId)               : null;
    if (body.responsableId  !== undefined) data.responsableId  = body.responsableId  ? String(body.responsableId)          : null;
    if (body.projetSourceId !== undefined) data.projetSourceId = body.projetSourceId ? String(body.projetSourceId)         : null;
    if (body.dateDebut      !== undefined) data.dateDebut      = new Date(body.dateDebut);
    if (body.dateFin        !== undefined) data.dateFin        = body.dateFin        ? new Date(body.dateFin)              : null;

    if (data.libelle === '') {
      return NextResponse.json({ error: 'Le libellé est obligatoire.' }, { status: 400 });
    }

    const operation = await prisma.operation.update({
      where: { id },
      data: data as any,
      include: OP_INCLUDE,
    });
    return NextResponse.json(operation);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la modification.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'operations', 'delete')) return forbidden();

  try {
    const { id } = await params;
    // Archivage logique plutôt que suppression physique
    const operation = await prisma.operation.update({
      where: { id },
      data: { statut: 'Archivée' },
    });
    return NextResponse.json(operation);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de l\'archivage.' }, { status: 500 });
  }
}
