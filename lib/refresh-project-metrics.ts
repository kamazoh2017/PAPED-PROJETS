/**
 * Helper serveur : recalcule et persiste le statut + les risques d'un projet
 * après toute modification de ses tâches (create / update / delete).
 *
 * Appelé dans les API routes tâches — JAMAIS côté client.
 */

import { prisma } from '@/lib/prisma';
import {
  computeProjectStatut,
  computeRiskScores,
  getRiskColor,
  getRiskLevel,
  TaskMetrics,
} from '@/lib/project-metrics';

export async function refreshProjectMetrics(projetId: string): Promise<void> {
  const project = await prisma.projet.findUnique({
    where: { id: projetId },
    select: {
      statut: true,
      dateDebutPrevisionnelle: true,
      dateFinPrevisionnelle: true,
      dateCreation: true,
      dateFinEffective: true,
    },
  });
  if (!project) return;

  const tasks = await prisma.tache.findMany({
    where: { projetId },
    select: {
      statut: true,
      priorite: true,
      dateFinPrevisionnelle: true,
      dateFinEffective: true,
    },
  });

  const taskMetrics: TaskMetrics[] = tasks.map((t) => ({
    statut: t.statut,
    priorite: t.priorite,
    dateFinPrevisionnelle: t.dateFinPrevisionnelle,
    dateFinEffective: t.dateFinEffective,
  }));

  // ── 1. Mise à jour automatique du statut projet ───────────────────────────
  const newStatut = computeProjectStatut(taskMetrics, project.statut);
  if (newStatut && newStatut !== project.statut) {
    await prisma.projet.update({ where: { id: projetId }, data: { statut: newStatut } });
  }

  // ── 2. Recalcul et upsert des scores de risque ────────────────────────────
  const now = Date.now();
  const risks = computeRiskScores(project, taskMetrics, now);

  const entries = [
    { libelle: 'retard',      taux: risks.retard },
    { libelle: 'horsDelai',   taux: risks.horsDelai },
    { libelle: 'progression', taux: risks.progression },
    { libelle: 'suspendu',    taux: risks.suspendu },
    { libelle: 'global',      taux: risks.global },
  ];

  for (const entry of entries) {
    await prisma.risqueProjet.upsert({
      where: { projetId_libelle: { projetId, libelle: entry.libelle } },
      update: {
        taux: entry.taux,
        gravite: getRiskLevel(entry.taux),
        couleur: getRiskColor(entry.taux),
      },
      create: {
        projetId,
        libelle: entry.libelle,
        taux: entry.taux,
        gravite: getRiskLevel(entry.taux),
        couleur: getRiskColor(entry.taux),
      },
    });
  }
}
