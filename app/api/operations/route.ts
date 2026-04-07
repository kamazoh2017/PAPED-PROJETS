import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden } from '@/lib/require-auth';

const OP_INCLUDE = {
  entite:       true,
  responsable:  { include: { entite: true } },
  projetSource: { select: { id: true, libelle: true } },
  _count:       { select: { taches: true } },
} as const;

export async function GET(request: NextRequest) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'operations', 'view')) return forbidden();

  const { searchParams } = new URL(request.url);
  const statut     = searchParams.get('statut');
  const entiteId   = searchParams.get('entiteId');
  const responsableId = searchParams.get('responsableId');

  try {
    const operations = await prisma.operation.findMany({
      where: {
        ...(statut      ? { statut }      : {}),
        ...(entiteId    ? { entiteId }    : {}),
        ...(responsableId ? { responsableId } : {}),
      },
      include: OP_INCLUDE,
      orderBy: { libelle: 'asc' },
    });
    return NextResponse.json(operations);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la récupération des opérations.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'operations', 'create')) return forbidden();

  try {
    const body = await request.json();
    const libelle = String(body.libelle || '').trim();
    if (!libelle) {
      return NextResponse.json({ error: 'Le libellé est obligatoire.' }, { status: 400 });
    }
    if (!body.entiteId && !body.responsableId) {
      return NextResponse.json({ error: 'Une entité ou un responsable est obligatoire.' }, { status: 400 });
    }
    if (!body.dateDebut) {
      return NextResponse.json({ error: 'La date de début est obligatoire.' }, { status: 400 });
    }

    const operation = await prisma.operation.create({
      data: {
        libelle,
        description:    body.description    ? String(body.description).trim()    : null,
        statut:         body.statut         ? String(body.statut)                 : 'Active',
        entiteId:       body.entiteId       ? String(body.entiteId)               : null,
        responsableId:  body.responsableId  ? String(body.responsableId)          : null,
        projetSourceId: body.projetSourceId ? String(body.projetSourceId)         : null,
        dateDebut:      new Date(body.dateDebut),
        dateFin:        body.dateFin        ? new Date(body.dateFin)              : null,
      },
      include: OP_INCLUDE,
    });
    return NextResponse.json(operation, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la création de l\'opération.' }, { status: 500 });
  }
}
