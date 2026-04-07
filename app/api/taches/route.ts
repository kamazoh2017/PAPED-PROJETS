import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden, canManageTaches } from '@/lib/require-auth';
import { refreshProjectMetrics } from '@/lib/refresh-project-metrics';
import { getTaskProgression, getPriorityWeight } from '@/lib/project-metrics';

function toOptionalDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizePriority(value: unknown): string {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'haute' || raw === 'high' || raw === 'bloquant') return 'Bloquant';
  if (raw === 'moyenne' || raw === 'moyen' || raw === 'medium' || raw === 'critique') return 'Critique';
  if (raw === 'basse' || raw === 'faible' || raw === 'low' || raw === 'normal') return 'Normal';
  return 'Critique';
}

export async function GET(request: NextRequest) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'projets', 'view')) return forbidden();

  try {
    const taches = await prisma.tache.findMany({
      include: {
        assigneA: true,
        projet: true,
      },
      orderBy: { dateCreation: 'desc' },
    });
    return NextResponse.json(taches);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la récupération des tâches' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, err } = await requireAuth(request);
  if (err) return err;

  try {
    const body = await request.json();

    if (!body?.projetId || !body?.libelle) {
      return NextResponse.json(
        { error: 'Le projet et le libelle de la tache sont obligatoires.' },
        { status: 400 }
      );
    }

    const projet = await prisma.projet.findUnique({
      where: { id: body.projetId },
      include: { equipeProjet: true },
    });
    if (!projet) {
      return NextResponse.json({ error: 'Projet introuvable.' }, { status: 400 });
    }

    // COORDINATEUR+ (permission statique) OU chef de projet (contextuel)
    if (!canManageTaches(user, projet.chefProjetId)) return forbidden();

    const assigneAId = body.assigneAId || null;
    if (assigneAId) {
      const personne = await prisma.personneRessource.findUnique({
        where: { id: assigneAId },
        select: { id: true },
      });
      if (!personne) {
        return NextResponse.json({ error: 'La personne assignée est introuvable.' }, { status: 400 });
      }
    }

    const dateDebut = toOptionalDate(body.dateDebutPrevisionnelle);
    const dateFin = toOptionalDate(body.dateFinPrevisionnelle);
    let statut = body.statut;
    if (!statut) {
      statut = (assigneAId && dateDebut && dateFin) ? 'A faire' : 'À planifier';
    }

    const prioriteNorm = normalizePriority(body.priorite);
    const tache = await prisma.tache.create({
      data: {
        projetId: body.projetId,
        libelle: body.libelle,
        description: body.description,
        priorite: prioriteNorm,
        assigneAId,
        statut,
        progression:   getTaskProgression(statut),
        poidsPriorite: getPriorityWeight(prioriteNorm),
        dateDebutPrevisionnelle: dateDebut,
        dateFinPrevisionnelle: dateFin,
      },
      include: { assigneA: true, projet: true },
    });

    await prisma.activiteTache.create({
      data: {
        tacheId: tache.id,
        projetId: tache.projetId,
        type: 'creation',
        detail: JSON.stringify({ statut: tache.statut }),
        compteId: user.compte.id,
      },
    });

    if (assigneAId) {
      const estDansEquipe = projet.equipeProjet.some((p: { id: string }) => p.id === assigneAId);
      if (!estDansEquipe) {
        await prisma.projet.update({
          where: { id: body.projetId },
          data: { equipeProjet: { connect: { id: assigneAId } } },
        });
      }
    }

    await refreshProjectMetrics(tache.projetId);
    return NextResponse.json(tache, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la creation de la tache' },
      { status: 500 }
    );
  }
}
