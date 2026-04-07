import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden } from '@/lib/require-auth';

type Params = { params: Promise<{ id: string }> };

const PERIODICITES = ['QUOTIDIENNE', 'HEBDOMADAIRE', 'MENSUELLE', 'TRIMESTRIELLE', 'SEMESTRIELLE', 'ANNUELLE', 'AD_HOC'];
const PRIORITES    = ['Critique', 'Haute', 'Normale', 'Basse'];

const TACHE_INCLUDE = {
  responsable: { include: { entite: true } },
  entite:      true,
  _count:      { select: { occurrences: true } },
} as const;

export async function PATCH(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'operations', 'update')) return forbidden();

  try {
    const { id } = await params;
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.libelle        !== undefined) data.libelle        = String(body.libelle).trim();
    if (body.description    !== undefined) data.description    = body.description    ? String(body.description).trim() : null;
    if (body.periodicite    !== undefined) {
      if (!PERIODICITES.includes(body.periodicite)) {
        return NextResponse.json({ error: 'Périodicité invalide.' }, { status: 400 });
      }
      data.periodicite = String(body.periodicite);
    }
    if (body.configPeriodicite !== undefined) data.configPeriodicite = body.configPeriodicite ? JSON.stringify(body.configPeriodicite) : null;
    if (body.delaiExecution !== undefined)    data.delaiExecution    = Number(body.delaiExecution);
    if (body.priorite       !== undefined)    data.priorite          = PRIORITES.includes(body.priorite) ? String(body.priorite) : 'Normale';
    if (body.responsableId  !== undefined)    data.responsableId     = body.responsableId  ? String(body.responsableId) : null;
    if (body.entiteId       !== undefined)    data.entiteId          = body.entiteId       ? String(body.entiteId)      : null;
    if (body.estActif       !== undefined)    data.estActif          = Boolean(body.estActif);
    if (body.dateDebut      !== undefined)    data.dateDebut         = new Date(body.dateDebut);
    if (body.dateFin        !== undefined)    data.dateFin           = body.dateFin ? new Date(body.dateFin) : null;

    const tache = await prisma.tacheOperationnelle.update({
      where: { id },
      data: data as any,
      include: TACHE_INCLUDE,
    });
    return NextResponse.json(tache);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la modification.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'operations', 'update')) return forbidden();

  try {
    const { id } = await params;
    // Désactivation logique — les occurrences existantes sont conservées
    const tache = await prisma.tacheOperationnelle.update({
      where: { id },
      data: { estActif: false },
    });
    return NextResponse.json(tache);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la désactivation.' }, { status: 500 });
  }
}
