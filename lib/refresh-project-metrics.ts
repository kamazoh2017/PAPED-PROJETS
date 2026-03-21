/**
 * Helper serveur : recalcule et persiste le statut, etatAvancement et risques
 * d'un projet après toute modification de ses tâches (create / update / delete).
 *
 * Appelé dans les API routes tâches — JAMAIS côté client.
 */

import { prisma } from '@/lib/prisma';
import {
  computeAvancement,
  computeProjectStatut,
  computeRiskScores,
  computeTaskAvancement,
  computeTauxAvancementReel,
  computeTauxAvancementAttendu,
  computeTauxAchevementReel,
  computeTauxAchevementAttendu,
  getTaskProgression,
  getPriorityWeight,
  getRiskColor,
  getRiskLevel,
  TaskMetrics,
  TaskWithDates,
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
      id: true,
      statut: true,
      priorite: true,
      dateDebutPrevisionnelle: true,
      dateDebutEffective: true,
      dateFinPrevisionnelle: true,
      dateFinEffective: true,
    },
  });

  const now = Date.now();

  const taskMetrics: TaskMetrics[] = tasks.map((t) => ({
    statut: t.statut,
    priorite: t.priorite,
    dateFinPrevisionnelle: t.dateFinPrevisionnelle,
    dateFinEffective: t.dateFinEffective,
  }));

  // ── 1. etatAvancement, progression et poidsPriorite de chaque tâche ──────
  for (const t of tasks) {
    const taskWithDates: TaskWithDates = {
      statut: t.statut,
      priorite: t.priorite,
      dateDebutPrevisionnelle: t.dateDebutPrevisionnelle,
      dateDebutEffective: t.dateDebutEffective,
      dateFinPrevisionnelle: t.dateFinPrevisionnelle,
      dateFinEffective: t.dateFinEffective,
    };
    const etatAvancement = computeTaskAvancement(taskWithDates, now);
    const progression    = getTaskProgression(t.statut);
    const poidsPriorite  = getPriorityWeight(t.priorite);
    await prisma.tache.update({
      where: { id: t.id },
      data: { etatAvancement, progression, poidsPriorite },
    });
  }

  // ── 2. Statut auto du projet ──────────────────────────────────────────────
  const newStatut = computeProjectStatut(taskMetrics, project.statut);

  // ── 3. etatAvancement du projet ───────────────────────────────────────────
  const etatAvancement = computeAvancement(project, taskMetrics, now);

  const tauxAvancementReel    = computeTauxAvancementReel(taskMetrics);
  const tauxAvancementAttendu = computeTauxAvancementAttendu(project, now);
  const tauxAchevementReel    = computeTauxAchevementReel(taskMetrics);
  const tauxAchevementAttendu = computeTauxAchevementAttendu(taskMetrics, now);

  await prisma.projet.update({
    where: { id: projetId },
    data: {
      ...(newStatut && newStatut !== project.statut ? { statut: newStatut } : {}),
      etatAvancement,
      tauxAvancementReel,
      tauxAvancementAttendu,
      tauxAchevementReel,
      tauxAchevementAttendu,
    },
  });

  // ── 4. Scores de risque ───────────────────────────────────────────────────
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
