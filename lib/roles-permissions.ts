/**
 * Système de rôles et permissions statiques.
 *
 * Hiérarchie : AGENT < GESTIONNAIRE < COORDINATEUR < ADMINISTRATEUR
 *
 * Logique :
 *  - Permissions STATIQUES  → accordées par le rôle quel que soit le contexte.
 *  - Permissions CONTEXTUELLES → vérifiées inline dans les routes API via les helpers
 *    de require-auth.ts (isChefProjet, isAssignedToTache, etc.).
 *
 * AGENT (statique) : lecture globale + créer un projet + profil
 *   Contextuel (chef de projet) : tout sauf move-valide
 *
 * GESTIONNAIRE = AGENT + validation tâches (move-valide) globale
 *                       + gestion entités/personnes globale
 *                       + commentaires sur tous les projets
 *   Contextuel (chef de projet) : edit projet/tâches, kanban non-validé, équipe
 *
 * COORDINATEUR = GESTIONNAIRE + contrôle total projets/tâches sans restriction contextuelle
 *
 * ADMINISTRATEUR = COORDINATEUR + gestion des comptes
 */

export type RoleKey = 'AGENT' | 'GESTIONNAIRE' | 'COORDINATEUR' | 'ADMINISTRATEUR';

export const ROLE_HIERARCHY: Record<RoleKey, number> = {
  AGENT:          0,
  GESTIONNAIRE:   1,
  COORDINATEUR:   2,
  ADMINISTRATEUR: 3,
};

export const ROLE_LABELS: Record<RoleKey, string> = {
  AGENT:          'Agent',
  GESTIONNAIRE:   'Assistant / Gestionnaire',
  COORDINATEUR:   'Coordinateur / Chef de projet entité',
  ADMINISTRATEUR: 'Administrateur',
};

export const ROLE_DESCRIPTIONS: Record<RoleKey, string> = {
  AGENT:
    'Peut créer des projets et les gérer en tant que chef de projet. ' +
    'Peut modifier le statut de ses tâches assignées. ' +
    'Consulte uniquement les projets et comptes des autres.',
  GESTIONNAIRE:
    'Comme Agent, mais peut valider les tâches (Terminé → Validé) sur tous les projets, ' +
    'gérer les entités et personnes ressources sans être chef de projet.',
  COORDINATEUR:
    'Contrôle total sur tous les projets et tâches indépendamment du chef de projet. ' +
    'Peut modifier, assigner, supprimer sans restriction.',
  ADMINISTRATEUR:
    'Gère les comptes utilisateurs, les rôles et les autorisations. ' +
    'A tous les droits du Coordinateur.',
};

// ── Paires de permissions ─────────────────────────────────────────────────────

type Perm = { pageKey: string; actionKey: string };

// Lecture globale — accordée à tous les rôles
const READ_ALL: Perm[] = [
  { pageKey: 'tableau-de-bord', actionKey: 'view' },

  // Liste projets
  { pageKey: 'projets', actionKey: 'view' },
  { pageKey: 'projets', actionKey: 'view-detail' },

  // Détail projet — infos générales
  { pageKey: 'detail-projet', actionKey: 'view' },
  { pageKey: 'detail-projet', actionKey: 'view-info' },
  { pageKey: 'detail-projet', actionKey: 'view-libelle' },
  { pageKey: 'detail-projet', actionKey: 'view-description' },
  { pageKey: 'detail-projet', actionKey: 'view-statut' },
  { pageKey: 'detail-projet', actionKey: 'view-chef' },
  { pageKey: 'detail-projet', actionKey: 'view-debut-prev' },
  { pageKey: 'detail-projet', actionKey: 'view-fin-prev' },
  { pageKey: 'detail-projet', actionKey: 'view-debut-eff' },
  { pageKey: 'detail-projet', actionKey: 'view-fin-eff' },
  { pageKey: 'detail-projet', actionKey: 'view-entites' },
  { pageKey: 'detail-projet', actionKey: 'view-equipe' },
  { pageKey: 'detail-projet', actionKey: 'view-pp' },

  // Détail projet — tâches
  { pageKey: 'detail-projet', actionKey: 'view-taches' },
  { pageKey: 'detail-projet', actionKey: 'view-detail-tache' },
  { pageKey: 'detail-projet', actionKey: 'view-exec' },
  { pageKey: 'detail-projet', actionKey: 'view-gantt' },
  { pageKey: 'detail-projet', actionKey: 'view-detail-tache-tab' },
  { pageKey: 'detail-projet', actionKey: 'view-tache-info' },
  { pageKey: 'detail-projet', actionKey: 'view-tache-libelle' },
  { pageKey: 'detail-projet', actionKey: 'view-tache-description' },
  { pageKey: 'detail-projet', actionKey: 'view-tache-priorite' },
  { pageKey: 'detail-projet', actionKey: 'view-tache-assigne' },
  { pageKey: 'detail-projet', actionKey: 'view-tache-statut-exec' },
  { pageKey: 'detail-projet', actionKey: 'view-tache-statut-av' },
  { pageKey: 'detail-projet', actionKey: 'view-tache-dates-prev' },
  { pageKey: 'detail-projet', actionKey: 'view-tache-dates-eff' },
  { pageKey: 'detail-projet', actionKey: 'view-comments' },
  { pageKey: 'detail-projet', actionKey: 'view-historique' },

  // Annuaire
  { pageKey: 'personnes',     actionKey: 'view' },
  { pageKey: 'entites',       actionKey: 'view' },

  // Comptes (lecture seule pour tous sauf ADMIN)
  { pageKey: 'comptes-acces', actionKey: 'view' },

  // Profil
  { pageKey: 'profil', actionKey: 'view' },

  // Opérations & occurrences
  { pageKey: 'operations',  actionKey: 'view' },
  { pageKey: 'occurrences', actionKey: 'view' },

  // Programmes & Cadre logique (lecture pour tous)
  { pageKey: 'programmes',    actionKey: 'view' },
  { pageKey: 'cadre-logique', actionKey: 'view' },
];

// AGENT — read + créer projet + profil + occurrences propres
const AGENT_PERMS: Perm[] = [
  ...READ_ALL,
  { pageKey: 'projets',     actionKey: 'create' },       // créer un projet
  { pageKey: 'profil',      actionKey: 'edit-info' },
  { pageKey: 'profil',      actionKey: 'change-password' },
  { pageKey: 'occurrences', actionKey: 'update' },        // marquer ses propres occurrences
];

// GESTIONNAIRE — AGENT + validation globale + commentaires + ressources + opérations
const GESTIONNAIRE_EXTRAS: Perm[] = [
  // Valider les tâches (Terminé → Validé) sur TOUS les projets
  { pageKey: 'detail-projet', actionKey: 'move-valide' },

  // Commentaires sur tous les projets (pas seulement les siens)
  { pageKey: 'detail-projet', actionKey: 'add-comment' },
  { pageKey: 'detail-projet', actionKey: 'edit-comment' },
  { pageKey: 'detail-projet', actionKey: 'reply-comment' },
  { pageKey: 'detail-projet', actionKey: 'delete-comment' },

  // Entités & personnes ressources (gestion globale, même sans être chef)
  { pageKey: 'personnes', actionKey: 'create' },
  { pageKey: 'personnes', actionKey: 'update' },
  { pageKey: 'personnes', actionKey: 'delete' },
  { pageKey: 'entites',   actionKey: 'create' },
  { pageKey: 'entites',   actionKey: 'update' },
  { pageKey: 'entites',   actionKey: 'delete' },

  // Opérations (gestion globale)
  { pageKey: 'operations',  actionKey: 'create' },
  { pageKey: 'operations',  actionKey: 'update' },
  { pageKey: 'operations',  actionKey: 'delete' },

  // Cadre logique : un GESTIONNAIRE peut éditer (ses activités via vérifs contextuelles)
  { pageKey: 'cadre-logique', actionKey: 'create' },
  { pageKey: 'cadre-logique', actionKey: 'update' },
];

const GESTIONNAIRE_PERMS: Perm[] = [...AGENT_PERMS, ...GESTIONNAIRE_EXTRAS];

// COORDINATEUR — GESTIONNAIRE + contrôle total projets/tâches sans restriction contextuelle
const COORDINATEUR_EXTRAS: Perm[] = [
  // Modifier le projet (sans être chef de projet)
  { pageKey: 'detail-projet', actionKey: 'edit-libelle' },
  { pageKey: 'detail-projet', actionKey: 'edit-description' },
  { pageKey: 'detail-projet', actionKey: 'edit-statut' },
  { pageKey: 'detail-projet', actionKey: 'edit-chef' },
  { pageKey: 'detail-projet', actionKey: 'edit-debut-prev' },
  { pageKey: 'detail-projet', actionKey: 'edit-fin-prev' },
  { pageKey: 'detail-projet', actionKey: 'edit-debut-eff' },
  { pageKey: 'detail-projet', actionKey: 'edit-fin-eff' },
  { pageKey: 'detail-projet', actionKey: 'delete' },           // supprimer le projet

  // Gestion équipe (sans être chef)
  { pageKey: 'detail-projet', actionKey: 'add-equipe' },
  { pageKey: 'detail-projet', actionKey: 'remove-equipe' },

  // Tâches — création, modification, suppression (sans être chef)
  { pageKey: 'detail-projet', actionKey: 'create-tache' },
  { pageKey: 'detail-projet', actionKey: 'save-tache' },
  { pageKey: 'detail-projet', actionKey: 'delete-tache' },
  { pageKey: 'detail-projet', actionKey: 'edit-tache-libelle' },
  { pageKey: 'detail-projet', actionKey: 'edit-tache-description' },
  { pageKey: 'detail-projet', actionKey: 'edit-tache-priorite' },
  { pageKey: 'detail-projet', actionKey: 'edit-tache-assigne' },
  { pageKey: 'detail-projet', actionKey: 'edit-tache-statut-exec' },
  { pageKey: 'detail-projet', actionKey: 'edit-tache-statut-av' },
  { pageKey: 'detail-projet', actionKey: 'edit-tache-dates-prev' },
  { pageKey: 'detail-projet', actionKey: 'edit-tache-dates-eff' },

  // Kanban — toutes colonnes sauf Validé (déjà accordé via GESTIONNAIRE)
  { pageKey: 'detail-projet', actionKey: 'move-a-faire' },
  { pageKey: 'detail-projet', actionKey: 'move-en-cours' },
  { pageKey: 'detail-projet', actionKey: 'move-termine' },
  { pageKey: 'detail-projet', actionKey: 'move-en-attente' },

  // Programmes — gestion complète
  { pageKey: 'programmes', actionKey: 'create' },
  { pageKey: 'programmes', actionKey: 'update' },
  { pageKey: 'programmes', actionKey: 'delete' },

  // Cadre logique — suppression réservée COORDINATEUR+
  { pageKey: 'cadre-logique', actionKey: 'delete' },
];

const COORDINATEUR_PERMS: Perm[] = [...GESTIONNAIRE_PERMS, ...COORDINATEUR_EXTRAS];

// ADMINISTRATEUR — COORDINATEUR + gestion des comptes
const ADMINISTRATEUR_EXTRAS: Perm[] = [
  { pageKey: 'comptes-acces', actionKey: 'create' },
  { pageKey: 'comptes-acces', actionKey: 'change-password' },
  { pageKey: 'comptes-acces', actionKey: 'suspend' },
  { pageKey: 'comptes-acces', actionKey: 'manage-authz' },
];

const ADMINISTRATEUR_PERMS: Perm[] = [...COORDINATEUR_PERMS, ...ADMINISTRATEUR_EXTRAS];

// ── Sets de permissions (clé composée pageKey:actionKey) ─────────────────────

export const ROLES_PERMISSIONS: Record<RoleKey, Set<string>> = {
  AGENT:          new Set(AGENT_PERMS.map(p => `${p.pageKey}:${p.actionKey}`)),
  GESTIONNAIRE:   new Set(GESTIONNAIRE_PERMS.map(p => `${p.pageKey}:${p.actionKey}`)),
  COORDINATEUR:   new Set(COORDINATEUR_PERMS.map(p => `${p.pageKey}:${p.actionKey}`)),
  ADMINISTRATEUR: new Set(ADMINISTRATEUR_PERMS.map(p => `${p.pageKey}:${p.actionKey}`)),
};

/**
 * Retourne la liste complète des permissions par défaut pour un rôle donné.
 * Utilisé pour pré-populer PermissionPageAction lors de la création/modification d'un compte.
 */
export function getDefaultPermissions(role: RoleKey): Perm[] {
  switch (role) {
    case 'AGENT':          return AGENT_PERMS;
    case 'GESTIONNAIRE':   return GESTIONNAIRE_PERMS;
    case 'COORDINATEUR':   return COORDINATEUR_PERMS;
    case 'ADMINISTRATEUR': return ADMINISTRATEUR_PERMS;
  }
}

/**
 * Vérifie si une permission est accordée par défaut pour un rôle.
 */
export function roleHasPermission(role: RoleKey, pageKey: string, actionKey: string): boolean {
  return ROLES_PERMISSIONS[role]?.has(`${pageKey}:${actionKey}`) ?? false;
}
