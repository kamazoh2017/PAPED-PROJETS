/**
 * Calculs de métriques projet — utilisés côté serveur (API routes) ET côté client (dashboard).
 * Source de vérité unique pour : statut auto, avancement, scores de risque.
 */

export interface TaskMetrics {
  statut: string;
  priorite: string;
  dateFinPrevisionnelle?: Date | string | null;
  dateFinEffective?: Date | string | null;
}

export interface ProjectForMetrics {
  statut: string;
  dateDebutPrevisionnelle?: Date | string | null;
  dateFinPrevisionnelle?: Date | string | null;
  dateCreation?: Date | string | null;
  dateFinEffective?: Date | string | null;
}

export type RiskLevel = 'Faible' | 'Moyen' | 'Élevé' | 'Critique';
export type RiskColor = 'Vert' | 'Jaune' | 'Orange' | 'Rouge';

// ─── Utilitaires internes ────────────────────────────────────────────────────

export function parseMetricsDate(value?: Date | string | null): number | null {
  if (!value) return null;
  const ts = new Date(value as string).getTime();
  return Number.isNaN(ts) ? null : ts;
}

export function normalizePriorityKey(value?: string): 'Bloquant' | 'Critique' | 'Normal' {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'haute' || raw === 'bloquant') return 'Bloquant';
  if (raw === 'moyenne' || raw === 'moyen' || raw === 'critique') return 'Critique';
  if (raw === 'basse' || raw === 'faible' || raw === 'low' || raw === 'normal') return 'Normal';
  return 'Critique';
}

export function isTaskDone(statut: string): boolean {
  const s = String(statut ?? '').trim().toLowerCase();
  return s === 'terminé' || s === 'termine' || s === 'validé' || s === 'valide';
}

function getTaskProgression(statut: string): number {
  const s = String(statut ?? '').trim().toLowerCase();
  if (s === 'à planifier' || s === 'a planifier' || s === 'a faire' || s === 'à faire') return 0;
  if (s === 'en cours' || s === 'en attente') return 50;
  if (s === 'terminé' || s === 'termine') return 99;
  if (s === 'validé' || s === 'valide') return 100;
  return 0;
}

function getPriorityWeight(priorite: string): number {
  const n = normalizePriorityKey(priorite);
  if (n === 'Bloquant') return 3;
  if (n === 'Critique') return 2;
  return 1;
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function safePct(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

// ─── Progression ────────────────────────────────────────────────────────────

/** Progression pondérée par priorité (0–100) */
export function getWeightedProgression(tasks: TaskMetrics[]): number {
  if (!tasks.length) return 0;
  const ws = tasks.reduce((acc, t) => acc + getTaskProgression(t.statut) * getPriorityWeight(t.priorite), 0);
  const tw = tasks.reduce((acc, t) => acc + getPriorityWeight(t.priorite), 0);
  return tw ? Math.round(ws / tw) : 0;
}

/** Progression attendue d'après les dates prévisionnelles (0–100) */
export function getExpectedProgress(project: ProjectForMetrics, nowTs: number): number {
  const startTs = parseMetricsDate(project.dateDebutPrevisionnelle) ?? parseMetricsDate(project.dateCreation);
  const endTs = parseMetricsDate(project.dateFinPrevisionnelle);
  if (startTs === null || endTs === null || endTs <= startTs) return 0;
  if (nowTs <= startTs) return 0;
  if (nowTs >= endTs) return 100;
  return clamp(((nowTs - startTs) / (endTs - startTs)) * 100);
}

// ─── Avancement ─────────────────────────────────────────────────────────────

export type Avancement = 'en-avance' | 'a-lheure' | 'retard' | 'hors-delai';

/**
 * Calcule l'état d'avancement d'un projet.
 * - hors-delai : la fin effective réelle dépasse la fin prévisionnelle
 * - en-avance  : progression réelle > prévue de plus de 5 points
 * - retard     : progression réelle < prévue de plus de 5 points
 * - a-lheure   : sinon
 */
export function computeAvancement(project: ProjectForMetrics, tasks: TaskMetrics[], nowTs: number): Avancement {
  const finPrev = parseMetricsDate(project.dateFinPrevisionnelle);
  const explicitFinEff = parseMetricsDate(project.dateFinEffective);
  const taskFinEff = tasks
    .map((t) => parseMetricsDate(t.dateFinEffective))
    .filter((ts): ts is number => ts !== null)
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

// ─── Scores de risque ────────────────────────────────────────────────────────

export interface RiskScores {
  retard: number;
  horsDelai: number;
  progression: number;
  suspendu: number;
  global: number;
}

/**
 * Calcule les 5 scores de risque d'un projet (0–100 chacun).
 * - retard      : % de tâches non-terminées dont la date de fin prév. est dépassée
 * - horsDelai   : % de tâches terminées dont la fin effective > fin prévue
 * - progression : écart entre progression attendue et réelle (quand le projet est en retard)
 * - suspendu    : % de tâches critiques en attente
 * - global      : pondération (30% retard + 20% horsDelai + 30% progression + 20% suspendu)
 */
export function computeRiskScores(project: ProjectForMetrics, tasks: TaskMetrics[], nowTs: number): RiskScores {
  const total = tasks.length;
  const done = tasks.filter((t) => isTaskDone(t.statut));

  const retardCount = tasks.filter((t) => {
    const fp = parseMetricsDate(t.dateFinPrevisionnelle);
    return fp !== null && nowTs > fp && !isTaskDone(t.statut);
  }).length;

  const horsDelaiCount = done.filter((t) => {
    const fp = parseMetricsDate(t.dateFinPrevisionnelle);
    const fe = parseMetricsDate(t.dateFinEffective);
    return fp !== null && fe !== null && fe > fp;
  }).length;

  const critiques = tasks.filter((t) => normalizePriorityKey(t.priorite) === 'Critique').length;
  const critiquesEnAttente = tasks.filter(
    (t) =>
      normalizePriorityKey(t.priorite) === 'Critique' &&
      String(t.statut ?? '').trim().toLowerCase() === 'en attente',
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

// ─── Statut auto ─────────────────────────────────────────────────────────────

/**
 * Calcule le statut projet automatiquement depuis ses tâches.
 * Retourne null si le statut ne doit pas être modifié (Suspendu / Clôturé).
 *
 * Règles (par ordre de priorité) :
 * 1. Toutes Validé                              → Clôturé
 * 2. Toutes Terminé ou Validé                   → Terminé
 * 3. Au moins une En cours ou En attente        → En cours
 * 4. Au moins une Terminé/Validé (work started) → En cours
 * 5. Tout À planifier / A faire                 → En démarrage
 */
export function computeProjectStatut(tasks: TaskMetrics[], currentStatut: string): string | null {
  if (currentStatut === 'Clôturé' || currentStatut === 'Suspendu') return null;
  if (tasks.length === 0) return 'En démarrage';
  if (tasks.every((t) => t.statut === 'Validé')) return 'Clôturé';
  if (tasks.every((t) => isTaskDone(t.statut))) return 'Terminé';
  if (tasks.some((t) => t.statut === 'En cours' || t.statut === 'En attente')) return 'En cours';
  if (tasks.some((t) => isTaskDone(t.statut))) return 'En cours'; // du travail a déjà été fait
  return 'En démarrage';
}

// ─── Niveau et couleur de risque ─────────────────────────────────────────────

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 25) return 'Faible';
  if (score <= 50) return 'Moyen';
  if (score <= 75) return 'Élevé';
  return 'Critique';
}

export function getRiskColor(score: number): RiskColor {
  if (score <= 25) return 'Vert';
  if (score <= 50) return 'Jaune';
  if (score <= 75) return 'Orange';
  return 'Rouge';
}
