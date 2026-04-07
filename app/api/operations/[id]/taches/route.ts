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

export async function GET(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'operations', 'view')) return forbidden();

  try {
    const { id: operationId } = await params;
    const taches = await prisma.tacheOperationnelle.findMany({
      where: { operationId },
      include: TACHE_INCLUDE,
      orderBy: { libelle: 'asc' },
    });
    return NextResponse.json(taches);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la récupération.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'operations', 'update')) return forbidden();

  try {
    const { id: operationId } = await params;
    const body = await request.json();

    const libelle = String(body.libelle || '').trim();
    if (!libelle) return NextResponse.json({ error: 'Le libellé est obligatoire.' }, { status: 400 });

    const periodicite = String(body.periodicite || '');
    if (!PERIODICITES.includes(periodicite)) {
      return NextResponse.json({ error: `Périodicité invalide. Valeurs : ${PERIODICITES.join(', ')}` }, { status: 400 });
    }
    if (!body.dateDebut) return NextResponse.json({ error: 'La date de début est obligatoire.' }, { status: 400 });

    const priorite = PRIORITES.includes(body.priorite) ? String(body.priorite) : 'Normale';

    const tache = await prisma.tacheOperationnelle.create({
      data: {
        operationId,
        libelle,
        description:       body.description       ? String(body.description).trim()                             : null,
        periodicite,
        configPeriodicite: body.configPeriodicite  ? JSON.stringify(body.configPeriodicite)                     : null,
        delaiExecution:    body.delaiExecution     ? Number(body.delaiExecution)                                 : 3,
        priorite,
        responsableId:     body.responsableId      ? String(body.responsableId)                                  : null,
        entiteId:          body.entiteId           ? String(body.entiteId)                                       : null,
        estActif:          body.estActif !== false,
        dateDebut:         new Date(body.dateDebut),
        dateFin:           body.dateFin            ? new Date(body.dateFin)                                      : null,
      },
      include: TACHE_INCLUDE,
    });
    return NextResponse.json(tache, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la création.' }, { status: 500 });
  }
}
