import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden } from '@/lib/require-auth';

type Params = { params: Promise<{ id: string }> };

const OCC_INCLUDE = {
  tacheOperationnelle: {
    include: {
      operation: { select: { id: true, libelle: true } },
    },
  },
  realisePar:  { include: { entite: true } },
  commentaires: {
    include: {
      compteAcces: { select: { id: true, login: true, personne: { select: { nom: true, prenoms: true } } } },
      reponses:    {
        include: {
          compteAcces: { select: { id: true, login: true, personne: { select: { nom: true, prenoms: true } } } },
        },
      },
    },
    where:   { parentId: null },
    orderBy: { dateCreation: 'asc' as const },
  },
} as const;

// Transitions autorisées
const TRANSITIONS: Record<string, string[]> = {
  'En attente':          ['En cours', 'Annulée'],
  'En cours':            ['Réalisée', 'Réalisée en retard', 'Annulée'],
  'En retard':           ['En cours', 'Réalisée en retard', 'Annulée'],
  'Réalisée':            [],
  'Réalisée en retard':  [],
  'Annulée':             [],
};

export async function GET(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'operations', 'view')) return forbidden();

  try {
    const { id } = await params;
    const occurrence = await prisma.occurrenceTache.findUnique({
      where: { id },
      include: OCC_INCLUDE,
    });
    if (!occurrence) return NextResponse.json({ error: 'Occurrence non trouvée.' }, { status: 404 });
    return NextResponse.json(occurrence);
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

    const current = await prisma.occurrenceTache.findUnique({
      where: { id },
      select: { statut: true, dateEcheance: true },
    });
    if (!current) return NextResponse.json({ error: 'Occurrence non trouvée.' }, { status: 404 });

    const nouveauStatut: string | undefined = body.statut;
    if (nouveauStatut && nouveauStatut !== current.statut) {
      const autorisees = TRANSITIONS[current.statut] ?? [];
      if (!autorisees.includes(nouveauStatut)) {
        return NextResponse.json(
          { error: `Transition "${current.statut}" → "${nouveauStatut}" non autorisée.` },
          { status: 400 }
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (nouveauStatut !== undefined) data.statut = nouveauStatut;
    if (body.realiseParId !== undefined) data.realiseParId = body.realiseParId ? String(body.realiseParId) : null;
    if (body.commentaire  !== undefined) data.commentaire  = body.commentaire  ? String(body.commentaire)  : null;

    // Si clôture : calculer dateRealisation et retardJours
    if (nouveauStatut === 'Réalisée' || nouveauStatut === 'Réalisée en retard') {
      const dateRealisation = body.dateRealisation ? new Date(body.dateRealisation) : new Date();
      data.dateRealisation = dateRealisation;
      const retard = Math.floor((dateRealisation.getTime() - current.dateEcheance.getTime()) / 86_400_000);
      data.retardJours = retard > 0 ? retard : 0;
      // Corriger le statut si l'utilisateur a passé "Réalisée" alors qu'en retard
      if (retard > 0) data.statut = 'Réalisée en retard';
    }

    const occurrence = await prisma.occurrenceTache.update({
      where: { id },
      data: data as any,
      include: OCC_INCLUDE,
    });
    return NextResponse.json(occurrence);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour.' }, { status: 500 });
  }
}
