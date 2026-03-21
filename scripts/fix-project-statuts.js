/**
 * Corrige le statut et les risques de TOUS les projets en base
 * en se basant sur l'état réel de leurs tâches.
 *
 * Idempotent — peut être relancé sans risque.
 * Usage : node scripts/fix-project-statuts.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── Logique de calcul (miroir de lib/project-metrics.ts) ───────────────────
// Inclut : statut auto, etatAvancement projet, etatAvancement tâche, risques

function isTaskDone(statut) {
  const s = String(statut ?? '').trim().toLowerCase();
  return s === 'terminé' || s === 'termine' || s === 'validé' || s === 'valide';
}

function getTaskProgression(statut) {
  const s = String(statut ?? '').trim().toLowerCase();
  if (s === 'à planifier' || s === 'a planifier' || s === 'a faire' || s === 'à faire') return 0;
  if (s === 'en cours' || s === 'en attente') return 50;
  if (s === 'terminé' || s === 'termine') return 99;
  if (s === 'validé' || s === 'valide') return 100;
  return 0;
}

function normalizePriority(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'haute' || raw === 'bloquant') return 'Bloquant';
  if (raw === 'moyenne' || raw === 'moyen' || raw === 'critique') return 'Critique';
  return 'Normal';
}

function getPriorityWeight(priorite) {
  const n = normalizePriority(priorite);
  if (n === 'Bloquant') return 3;
  if (n === 'Critique') return 2;
  return 1;
}

function clamp(v) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function safePct(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function getWeightedProgression(tasks) {
  if (!tasks.length) return 0;
  const ws = tasks.reduce((acc, t) => acc + getTaskProgression(t.statut) * getPriorityWeight(t.priorite), 0);
  const tw = tasks.reduce((acc, t) => acc + getPriorityWeight(t.priorite), 0);
  return tw ? Math.round(ws / tw) : 0;
}

function parseMetricsDate(value) {
  if (!value) return null;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? null : ts;
}

function getExpectedProgress(project, nowTs) {
  const startTs = parseMetricsDate(project.dateDebutPrevisionnelle) ?? parseMetricsDate(project.dateCreation);
  const endTs = parseMetricsDate(project.dateFinPrevisionnelle);
  if (startTs === null || endTs === null || endTs <= startTs) return 0;
  if (nowTs <= startTs) return 0;
  if (nowTs >= endTs) return 100;
  return clamp(((nowTs - startTs) / (endTs - startTs)) * 100);
}

function computeProjectStatut(tasks, currentStatut) {
  if (currentStatut === 'Clôturé' || currentStatut === 'Suspendu') return null;
  if (tasks.length === 0) return 'En démarrage';
  if (tasks.every(t => t.statut === 'Validé')) return 'Clôturé';
  if (tasks.every(t => isTaskDone(t.statut))) return 'Terminé';
  if (tasks.some(t => t.statut === 'En cours' || t.statut === 'En attente')) return 'En cours';
  if (tasks.some(t => isTaskDone(t.statut))) return 'En cours'; // du travail a déjà été fait
  return 'En démarrage';
}

function computeRiskScores(project, tasks, nowTs) {
  const total = tasks.length;
  const done = tasks.filter(t => isTaskDone(t.statut));

  const retardCount = tasks.filter(t => {
    const fp = parseMetricsDate(t.dateFinPrevisionnelle);
    return fp !== null && nowTs > fp && !isTaskDone(t.statut);
  }).length;

  const horsDelaiCount = done.filter(t => {
    const fp = parseMetricsDate(t.dateFinPrevisionnelle);
    const fe = parseMetricsDate(t.dateFinEffective);
    return fp !== null && fe !== null && fe > fp;
  }).length;

  const critiques = tasks.filter(t => normalizePriority(t.priorite) === 'Critique').length;
  const critiquesEnAttente = tasks.filter(
    t => normalizePriority(t.priorite) === 'Critique' && String(t.statut ?? '').trim().toLowerCase() === 'en attente'
  ).length;

  const retard = clamp(safePct(retardCount, total));
  const horsDelai = clamp(safePct(horsDelaiCount, done.length));
  const suspendu = clamp(safePct(critiquesEnAttente, critiques));

  const real = getWeightedProgression(tasks);
  const expected = getExpectedProgress(project, nowTs);
  const progression = clamp(Math.max(0, expected - real));

  const global = clamp(0.3 * retard + 0.2 * horsDelai + 0.3 * progression + 0.2 * suspendu);
  return { retard, horsDelai, progression, suspendu, global };
}

function getRiskLevel(score) {
  if (score <= 25) return 'Faible';
  if (score <= 50) return 'Moyen';
  if (score <= 75) return 'Élevé';
  return 'Critique';
}

function getRiskColor(score) {
  if (score <= 25) return 'Vert';
  if (score <= 50) return 'Jaune';
  if (score <= 75) return 'Orange';
  return 'Rouge';
}

function isTaskDoneStr(statut) {
  const s = String(statut ?? '').trim().toLowerCase();
  return s === 'terminé' || s === 'termine' || s === 'validé' || s === 'valide';
}

function computeTaskAvancement(task, nowTs) {
  const isDone = isTaskDoneStr(task.statut);
  const finPrev = parseMetricsDate(task.dateFinPrevisionnelle);
  const debutPrev = parseMetricsDate(task.dateDebutPrevisionnelle);
  const finEff = parseMetricsDate(task.dateFinEffective);

  if (isDone && finPrev !== null && finEff !== null && finEff > finPrev) return 'hors-delai';
  if (!isDone && finPrev !== null && nowTs > finPrev) return 'hors-delai';
  if (isDone) return 'en-avance';
  if (!isDone && debutPrev !== null && nowTs > debutPrev) return 'retard';
  return 'a-lheure';
}

function computeProjectAvancement(project, tasks, nowTs) {
  const finPrev = parseMetricsDate(project.dateFinPrevisionnelle);
  const explicitFinEff = parseMetricsDate(project.dateFinEffective);
  const taskFinEff = tasks
    .map(t => parseMetricsDate(t.dateFinEffective))
    .filter(ts => ts !== null)
    .sort((a, b) => b - a)[0] ?? null;
  const finEff = explicitFinEff ?? taskFinEff;

  if (finPrev !== null && finEff !== null && finEff > finPrev) return 'hors-delai';

  const real = getWeightedProgression(tasks);
  const expected = getExpectedProgress(project, nowTs);
  const delta = real - expected;
  if (delta > 5) return 'en-avance';
  if (delta < -5) return 'retard';
  return 'a-lheure';
}

// ─── Script principal ────────────────────────────────────────────────────────

async function main() {
  console.log('🔄 Recalcul des statuts et risques de tous les projets...\n');

  const projets = await prisma.projet.findMany({
    select: {
      id: true,
      libelle: true,
      statut: true,
      dateDebutPrevisionnelle: true,
      dateFinPrevisionnelle: true,
      dateCreation: true,
      dateFinEffective: true,
    },
  });

  const now = Date.now();
  let statutsModifies = 0;
  let risquesUpserted = 0;
  let avancementsModifies = 0;

  for (const projet of projets) {
    const tasks = await prisma.tache.findMany({
      where: { projetId: projet.id },
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

    // 1. etatAvancement de chaque tâche
    for (const t of tasks) {
      const ea = computeTaskAvancement(t, now);
      await prisma.tache.update({ where: { id: t.id }, data: { etatAvancement: ea } });
    }
    avancementsModifies += tasks.length;

    // 2. Statut projet
    const newStatut = computeProjectStatut(tasks, projet.statut);
    const statutLabel = newStatut && newStatut !== projet.statut
      ? `${projet.statut} → ${newStatut}`
      : `${projet.statut} (inchangé)`;
    if (newStatut && newStatut !== projet.statut) statutsModifies++;

    // 3. etatAvancement projet
    const etatAvancement = computeProjectAvancement(projet, tasks, now);

    await prisma.projet.update({
      where: { id: projet.id },
      data: {
        ...(newStatut && newStatut !== projet.statut ? { statut: newStatut } : {}),
        etatAvancement,
      },
    });

    // 4. Risques
    const risks = computeRiskScores(projet, tasks, now);
    const entries = [
      { libelle: 'retard',      taux: risks.retard },
      { libelle: 'horsDelai',   taux: risks.horsDelai },
      { libelle: 'progression', taux: risks.progression },
      { libelle: 'suspendu',    taux: risks.suspendu },
      { libelle: 'global',      taux: risks.global },
    ];

    for (const entry of entries) {
      await prisma.risqueProjet.upsert({
        where: { projetId_libelle: { projetId: projet.id, libelle: entry.libelle } },
        update: { taux: entry.taux, gravite: getRiskLevel(entry.taux), couleur: getRiskColor(entry.taux) },
        create: {
          projetId: projet.id,
          libelle: entry.libelle,
          taux: entry.taux,
          gravite: getRiskLevel(entry.taux),
          couleur: getRiskColor(entry.taux),
        },
      });
      risquesUpserted++;
    }

    const shortName = projet.libelle.length > 60 ? projet.libelle.slice(0, 60) + '…' : projet.libelle;
    const icon = newStatut && newStatut !== projet.statut ? '✅' : '⏭️ ';
    console.log(`${icon} [${tasks.length} tâches] ${shortName}`);
    console.log(`   Statut : ${statutLabel} | Avancement : ${etatAvancement} | Risque global : ${risks.global}% (${getRiskLevel(risks.global)})`);
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Recalcul terminé.
   Projets traités          : ${projets.length}
   Statuts corrigés         : ${statutsModifies}
   Avancements mis à jour   : ${avancementsModifies} tâches + ${projets.length} projets
   Risques mis à jour       : ${risquesUpserted}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
