import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden, canManageProjet, hasRole, hasRoleAtLeast } from '@/lib/require-auth';

type Params = { params: Promise<{ id: string }> };

function parseDate(v: unknown): Date | null {
  if (v === null || v === undefined || v === '') return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

async function loadActiviteContext(id: string) {
  return prisma.activite.findUnique({
    where: { id },
    select: {
      id: true,
      responsableId: true,
      resultat: { select: { projet: { select: { chefProjetId: true } } } },
    },
  });
}

export async function GET(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'cadre-logique', 'view')) return forbidden();

  const { id } = await params;
  const activite = await prisma.activite.findUnique({
    where: { id },
    include: {
      resultat: { select: { id: true, code: true, libelle: true, projetId: true } },
      parent: { select: { id: true, code: true, libelle: true } },
      enfants: {
        orderBy: [{ ordre: 'asc' }, { code: 'asc' }],
        include: { responsable: { select: { id: true, nom: true, prenoms: true } } },
      },
      responsable: { select: { id: true, nom: true, prenoms: true } },
      taches: {
        select: {
          id: true, libelle: true, statut: true, progression: true,
          assigneA: { select: { id: true, nom: true, prenoms: true } },
        },
        orderBy: { ordre: 'asc' },
      },
    },
  });
  if (!activite) return NextResponse.json({ error: 'Activité introuvable.' }, { status: 404 });
  return NextResponse.json(activite);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'cadre-logique', 'update')) return forbidden();

  const { id } = await params;
  const ctx = await loadActiviteContext(id);
  if (!ctx) return NextResponse.json({ error: 'Activité introuvable.' }, { status: 404 });

  // canManageProjet OU GESTIONNAIRE responsable de l'activité
  const canManage = canManageProjet(user, ctx.resultat.projet.chefProjetId);
  const isResp = hasRole(user, 'GESTIONNAIRE') && hasRoleAtLeast(user, 'GESTIONNAIRE') &&
    ctx.responsableId !== null && ctx.responsableId === user.personne?.id;
  if (!canManage && !isResp) return forbidden();

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {
      code:          body.code !== undefined ? String(body.code).trim() : undefined,
      libelle:       body.libelle !== undefined ? String(body.libelle).trim() : undefined,
      description:   body.description !== undefined ? (body.description ? String(body.description).trim() : null) : undefined,
      responsableId: body.responsableId !== undefined ? (body.responsableId ? String(body.responsableId) : null) : undefined,
      dateDebutPrev: body.dateDebutPrev !== undefined ? parseDate(body.dateDebutPrev) : undefined,
      dateFinPrev:   body.dateFinPrev !== undefined ? parseDate(body.dateFinPrev) : undefined,
      dateDebutEff:  body.dateDebutEff !== undefined ? parseDate(body.dateDebutEff) : undefined,
      dateFinEff:    body.dateFinEff !== undefined ? parseDate(body.dateFinEff) : undefined,
      statut:        body.statut !== undefined ? String(body.statut).trim() : undefined,
      progression:   body.progression !== undefined ? Math.max(0, Math.min(100, Number(body.progression))) : undefined,
      ordre:         body.ordre !== undefined ? Number(body.ordre) : undefined,
      parentActiviteId: body.parentActiviteId !== undefined ? (body.parentActiviteId || null) : undefined,
    };

    // Auto-fill dateDebutEff si statut → En cours
    if (body.statut === 'En cours' && body.dateDebutEff === undefined) {
      const cur = await prisma.activite.findUnique({ where: { id }, select: { dateDebutEff: true } });
      if (!cur?.dateDebutEff) updates.dateDebutEff = new Date();
    }
    if (body.statut === 'Terminée' && body.dateFinEff === undefined) {
      const cur = await prisma.activite.findUnique({ where: { id }, select: { dateFinEff: true } });
      if (!cur?.dateFinEff) updates.dateFinEff = new Date();
    }

    const activite = await prisma.activite.update({
      where: { id },
      data: updates,
      include: { responsable: { select: { id: true, nom: true, prenoms: true } } },
    });
    return NextResponse.json(activite);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la modification.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'cadre-logique', 'delete')) return forbidden();

  const { id } = await params;
  const ctx = await loadActiviteContext(id);
  if (!ctx) return NextResponse.json({ error: 'Activité introuvable.' }, { status: 404 });
  if (!canManageProjet(user, ctx.resultat.projet.chefProjetId)) return forbidden();

  // Vérifier qu'il n'y a pas de tâches ni sous-activités rattachées
  const countTaches = await prisma.tache.count({ where: { activiteId: id } });
  const countEnfants = await prisma.activite.count({ where: { parentActiviteId: id } });
  if (countTaches > 0 || countEnfants > 0) {
    return NextResponse.json(
      { error: `Impossible de supprimer : ${countTaches} tâche(s) et ${countEnfants} sous-activité(s) rattachées.` },
      { status: 409 },
    );
  }

  await prisma.activite.delete({ where: { id } });
  return NextResponse.json({ message: 'Activité supprimée.' });
}
