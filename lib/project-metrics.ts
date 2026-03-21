/**
 * Calculs de métriques projet — utilisés côté serveur (API routes) ET côté client (dashboard).
 * Source de vérité unique pour : statut auto, avancement, scores de risque.
 */

export interface TaskMetrics {
  statut: string;
  priorite: string;
  dateDebutPrevisionnelle?: Date | string | null;
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

/**
 * Progression d'une tâche selon son statut (valeur stockée dans tache.progression).
 * À planifier / À faire → 0 | En cours → 50 | En attente → 40
 * Terminé → 90 | Validé → 100
 */
export function getTaskProgression(statut: string): number {
  const s = String(statut ?? '').trim().toLowerCase();
  if (s === 'à planifier' || s === 'a planifier' || s === 'a faire' || s === 'à faire') return 0;
  if (s === 'en cours') return 50;
  if (s === 'en attente') return 40;
  if (s === 'terminé' || s === 'termine') return 90;
  if (s === 'validé' || s === 'valide') return 100;
  return 0;
}

/**
 * Poids de priorité d'une tâche (valeur stockée dans tache.poidsPriorite).
 * Bloquant → 3 | Critique → 2 | Normal → 1
 */
export function getPriorityWeight(priorite: string): number {
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
 *
 * Terminé / Clôturé
 *   finEff < finPrev  → en-avance
 *   finEff = finPrev  → a-lheure
 *   finEff > finPrev  → hors-delai
 *
 * En cours / En démarrage / Suspendu
 *   aujourd'hui > finPrev       → hors-delai
 *   écart > +10 pts             → en-avance
 *   écart < -10 pts             → retard
 *   sinon                       → a-lheure
 *   (écart = avancementReel - avancementAttendu)
 */
export function computeAvancement(
  project: ProjectForMetrics,
  avancementReel: number,
  avancementAttendu: number,
  nowTs: number,
): Avancement {
  const statut  = String((project as any).statut ?? '').trim().toLowerCase();
  const finPrev = parseMetricsDate(project.dateFinPrevisionnelle);
  const finEff  = parseMetricsDate(project.dateFinEffective);

  // ── Terminé ou Clôturé ──────────────────────────────────────────────────
  if (statut === 'terminé' || statut === 'termine' || statut === 'clôturé' || statut === 'cloture') {
    if (finEff !== null && finPrev !== null) {
      if (finEff < finPrev)  return 'en-avance';
      if (finEff === finPrev) return 'a-lheure';
      return 'hors-delai';
    }
    return 'a-lheure';
  }

  // ── En cours / En démarrage / Suspendu ──────────────────────────────────
  if (finPrev !== null && nowTs > finPrev) return 'hors-delai';
  const ecart = avancementReel - avancementAttendu;
  if (ecart > 10)  return 'en-avance';
  if (ecart < -10) return 'retard';
  return 'a-lheure';
}

// ─── Avancement d'une tâche individuelle ─────────────────────────────────────

export interface TaskWithDates extends TaskMetrics {
  dateDebutEffective?: Date | string | null;
}

/**
 * Calcule l'état d'avancement d'une tâche individuelle.
 *
 * Terminé / Validé
 *   finEff < finPrev  → en-avance
 *   finEff = finPrev  → a-lheure
 *   finEff > finPrev  → hors-delai
 *
 * En cours
 *   debutEff < debutPrev              → en-avance
 *   aujourd'hui < finPrev             → a-lheure
 *   aujourd'hui >= finPrev            → retard
 *
 * À faire
 *   aujourd'hui > finPrev             → hors-delai  (priorité max)
 *   aujourd'hui >= debutPrev          → retard
 *   sinon                             → a-lheure
 *
 * En attente
 *   aujourd'hui > finPrev             → hors-delai
 *   sinon                             → a-lheure
 *
 * À planifier / autres               → a-lheure
 */
export function computeTaskAvancement(task: TaskWithDates, nowTs: number): Avancement {
  const s = String(task.statut ?? '').trim().toLowerCase();
  const finPrev   = parseMetricsDate(task.dateFinPrevisionnelle);
  const debutPrev = parseMetricsDate(task.dateDebutPrevisionnelle);
  const finEff    = parseMetricsDate(task.dateFinEffective);
  const debutEff  = parseMetricsDate((task as TaskWithDates).dateDebutEffective);

  // ── Terminé ou Validé ───────────────────────────────────────────────────
  if (s === 'terminé' || s === 'termine' || s === 'validé' || s === 'valide') {
    if (finEff !== null && finPrev !== null) {
      if (finEff < finPrev) return 'en-avance';
      if (finEff === finPrev) return 'a-lheure';
      return 'hors-delai';
    }
    return 'a-lheure';
  }

  // ── En cours ────────────────────────────────────────────────────────────
  if (s === 'en cours') {
    if (debutEff !== null && debutPrev !== null && debutEff < debutPrev) return 'en-avance';
    if (finPrev !== null && nowTs >= finPrev) return 'retard';
    return 'a-lheure';
  }

  // ── À faire ─────────────────────────────────────────────────────────────
  if (s === 'a faire' || s === 'à faire') {
    if (finPrev !== null && nowTs > finPrev) return 'hors-delai';
    if (debutPrev !== null && nowTs >= debutPrev) return 'retard';
    return 'a-lheure';
  }

  // ── En attente ──────────────────────────────────────────────────────────
  if (s === 'en attente') {
    if (finPrev !== null && nowTs > finPrev) return 'hors-delai';
    return 'a-lheure';
  }

  // ── À planifier / autres ────────────────────────────────────────────────
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

// ─── Taux d'avancement et d'achèvement ──────────────────────────────────────

/**
 * Taux d'avancement réel (effectif) : moyenne pondérée de progression × poidsPriorite.
 * Alias de getWeightedProgression, retourne 0–100.
 */
export function computeTauxAvancementReel(tasks: TaskMetrics[]): number {
  return getWeightedProgression(tasks);
}

/**
 * Progression attendue d'une tâche individuelle à la date nowTs.
 *   aujourd'hui < débutPrev  → 0 %
 *   aujourd'hui >= finPrev   → 100 %
 *   sinon                    → interpolation linéaire (0–100)
 */
function getTaskExpectedProgression(task: TaskMetrics, nowTs: number): number {
  const debutPrev = parseMetricsDate(task.dateDebutPrevisionnelle);
  const finPrev   = parseMetricsDate(task.dateFinPrevisionnelle);
  if (debutPrev === null || finPrev === null || finPrev <= debutPrev) return 0;
  if (nowTs < debutPrev) return 0;
  if (nowTs >= finPrev)  return 100;
  return clamp(((nowTs - debutPrev) / (finPrev - debutPrev)) * 100);
}

/**
 * Taux d'avancement attendu (prévisionnel) :
 * simulation de la progression que chaque tâche devrait avoir à aujourd'hui
 * d'après ses dates prévisionnelles, puis moyenne pondérée par poids_priorité.
 * Σ(progressionAttendue × poidsPriorite) / Σ(poidsPriorite)
 */
export function computeTauxAvancementAttendu(tasks: TaskMetrics[], nowTs: number): number {
  if (!tasks.length) return 0;
  const ws = tasks.reduce((acc, t) => acc + getTaskExpectedProgression(t, nowTs) * getPriorityWeight(t.priorite), 0);
  const tw = tasks.reduce((acc, t) => acc + getPriorityWeight(t.priorite), 0);
  return tw ? Math.round(ws / tw) : 0;
}

/**
 * Taux d'achèvement réel (effectif) : % de tâches Terminées ou Validées sur le total.
 */
export function computeTauxAchevementReel(tasks: TaskMetrics[]): number {
  if (!tasks.length) return 0;
  const done = tasks.filter((t) => isTaskDone(t.statut)).length;
  return Math.round((done / tasks.length) * 100);
}

/**
 * Taux d'achèvement attendu (prévisionnel) : % de tâches dont la dateFinPrevisionnelle
 * est déjà passée (elles auraient dû être terminées à ce stade).
 */
export function computeTauxAchevementAttendu(tasks: TaskMetrics[], nowTs: number): number {
  if (!tasks.length) return 0;
  const due = tasks.filter((t) => {
    const fp = parseMetricsDate(t.dateFinPrevisionnelle);
    return fp !== null && nowTs >= fp;
  }).length;
  return Math.round((due / tasks.length) * 100);
}
