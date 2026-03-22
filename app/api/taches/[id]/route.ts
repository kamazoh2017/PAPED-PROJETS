import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden } from '@/lib/require-auth';
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'detail-projet', 'manage-execution')) return forbidden();

  try {
    const { id } = await params;
    const body = await request.json();

    // Lire l'état avant modification pour le log d'activité
    const oldTache = await prisma.tache.findUnique({
      where: { id },
      select: {
        statut: true,
        assigneAId: true,
        projetId: true,
        dateDebutEffective: true,
        dateDebutPrevisionnelle: true,
        assigneA: { select: { nom: true, prenoms: true } },
      },
    });

    if (!oldTache) {
      return NextResponse.json({ error: 'Tâche introuvable.' }, { status: 404 });
    }

    // ── Validation des transitions de statut ──────────────────────────────────
    if (body.statut !== undefined && body.statut !== oldTache.statut) {
      const newStatut: string = body.statut;
      const hasStarted = !!oldTache.dateDebutEffective;
      const today = new Date().toISOString().slice(0, 10);
      const debutPrev = oldTache.dateDebutPrevisionnelle
        ? oldTache.dateDebutPrevisionnelle.toISOString().slice(0, 10)
        : null;

      if (newStatut === 'À planifier' && hasStarted) {
        return NextResponse.json(
          { error: 'Impossible de repasser à "À planifier" : la tâche a déjà démarré.' },
          { status: 400 }
        );
      }
      if (newStatut === 'A faire' && hasStarted) {
        if (!debutPrev || today >= debutPrev) {
          return NextResponse.json(
            { error: 'Impossible de repasser à "À faire" : la date de début prévisionnel est atteinte ou dépassée.' },
            { status: 400 }
          );
        }
      }
      // "En attente" : interdit depuis Terminé ou Validé (états finaux)
      if (newStatut === 'En attente' &&
          (oldTache.statut === 'Terminé' || oldTache.statut === 'Validé')) {
        return NextResponse.json(
          { error: 'Une tâche terminée ou validée ne peut pas repasser en "En attente".' },
          { status: 400 }
        );
      }
    }

    const prioriteNorm = body.priorite === undefined ? undefined : normalizePriority(body.priorite);
    const updates: Record<string, unknown> = {
      libelle:                  body.libelle,
      description:              body.description,
      priorite:                 prioriteNorm,
      assigneAId:               body.assigneAId,
      statut:                   body.statut,
      dateDebutPrevisionnelle:  toOptionalDate(body.dateDebutPrevisionnelle),
      dateFinPrevisionnelle:    toOptionalDate(body.dateFinPrevisionnelle),
    };

    // Recalcul immédiat de progression et poidsPriorite
    if (body.statut !== undefined) {
      updates.progression = getTaskProgression(body.statut);
    }
    if (prioriteNorm !== undefined) {
      updates.poidsPriorite = getPriorityWeight(prioriteNorm);
    }

    // ── Effets de bord sur les dates effectives ───────────────────────────────
    if (body.statut !== undefined && body.statut !== oldTache.statut) {
      const newStatut: string = body.statut;

      // → En cours : initialiser dateDebutEffective si pas encore définie
      if (newStatut === 'En cours' && body.dateDebutEffective === undefined) {
        if (!oldTache.dateDebutEffective) {
          updates.dateDebutEffective = new Date();
        }
      }

      // → Terminé ou Validé : fixer dateFinEffective ; initialiser dateDebutEffective si besoin
      if ((newStatut === 'Terminé' || newStatut === 'Validé') && body.dateFinEffective === undefined) {
        updates.dateFinEffective = new Date();
        if (!oldTache.dateDebutEffective && body.dateDebutEffective === undefined) {
          updates.dateDebutEffective = new Date();
        }
      }

      // Terminé ou Validé → En cours : remettre dateFinEffective à null
      if (newStatut === 'En cours' &&
          (oldTache.statut === 'Terminé' || oldTache.statut === 'Validé') &&
          body.dateFinEffective === undefined) {
        updates.dateFinEffective = null;
      }

      // En attente → Terminé ou Validé : fixer dateFinEffective
      if ((newStatut === 'Terminé' || newStatut === 'Validé') &&
          oldTache.statut === 'En attente' &&
          body.dateFinEffective === undefined) {
        updates.dateFinEffective = new Date();
      }
    }

    // Nettoyer les undefined
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    const tache = await prisma.tache.update({
      where: { id },
      data: updates,
      include: { assigneA: { select: { nom: true, prenoms: true } }, projet: true },
    });

    // Construire les enregistrements d'activité
    const activites: {
      tacheId: string;
      projetId: string;
      type: string;
      detail: string;
      compteId: string | null;
    }[] = [];

    if (body.statut !== undefined && body.statut !== oldTache.statut) {
      activites.push({
        tacheId: id,
        projetId: oldTache.projetId,
        type: 'changement_statut',
        detail: JSON.stringify({ avant: oldTache.statut, apres: body.statut }),
        compteId: user.compte.id,
      });
    }

    if (body.assigneAId !== undefined && body.assigneAId !== oldTache.assigneAId) {
      const nomAvant = oldTache.assigneA
        ? `${oldTache.assigneA.prenoms} ${oldTache.assigneA.nom}`
        : null;
      const nomApres = tache.assigneA
        ? `${tache.assigneA.prenoms} ${tache.assigneA.nom}`
        : null;
      activites.push({
        tacheId: id,
        projetId: oldTache.projetId,
        type: 'assignation',
        detail: JSON.stringify({ avant: nomAvant, apres: nomApres }),
        compteId: user.compte.id,
      });
    }

    if (activites.length) {
      await prisma.activiteTache.createMany({ data: activites });
    }

    // Si assignée à une nouvelle personne, l'ajouter à l'équipe
    if (body.assigneAId) {
      const projet = await prisma.projet.findUnique({
        where: { id: tache.projetId },
        include: { equipeProjet: { select: { id: true } } },
      });

      const estDansEquipe = projet?.equipeProjet.some((p) => p.id === body.assigneAId);
      if (!estDansEquipe) {
        await prisma.projet.update({
          where: { id: tache.projetId },
          data: { equipeProjet: { connect: { id: body.assigneAId } } },
        });
      }
    }

    // Recalcul automatique statut projet + risques
    await refreshProjectMetrics(oldTache.projetId);

    return NextResponse.json(tache);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la tâche' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'detail-projet', 'delete-tache')) return forbidden();

  try {
    const { id } = await params;

    // Récupérer le projetId avant suppression pour le recalcul
    const tache = await prisma.tache.findUnique({ where: { id }, select: { projetId: true } });
    if (!tache) return NextResponse.json({ error: 'Tâche introuvable.' }, { status: 404 });

    await prisma.tache.delete({ where: { id } });

    // Recalcul automatique statut projet + risques
    await refreshProjectMetrics(tache.projetId);

    return NextResponse.json({ message: 'Tâche supprimée' });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression de la tâche' }, { status: 500 });
  }
}
