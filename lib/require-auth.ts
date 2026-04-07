import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from './auth-session';
import { auditStorage } from './audit-context';
import { ROLES_PERMISSIONS, ROLE_HIERARCHY, type RoleKey } from './roles-permissions';

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

export function unauthorized() {
  return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
}

export async function requireAuth(
  request: NextRequest
): Promise<{ user: SessionUser; err: null } | { user: null; err: NextResponse }> {
  const user = await getSessionUser(request);
  if (!user) return { user: null, err: unauthorized() };
  auditStorage.enterWith({
    compteId: user.compte.id,
    login: user.compte.login ?? undefined,
  });
  return { user, err: null };
}

// ── canDo ─────────────────────────────────────────────────────────────────────

/**
 * Vérifie si l'utilisateur est autorisé pour (pageKey, actionKey).
 *
 * Ordre de résolution :
 *  1. superAdmin              → toujours autorisé
 *  2. Surcharge individuelle  → PermissionPageAction (si un enregistrement explicite existe)
 *  3. Permissions du rôle     → ROLES_PERMISSIONS[role]
 */
export function canDo(user: SessionUser, pageKey: string, actionKey: string): boolean {
  if (user.compte.estSuperAdmin) return true;

  // Surcharge individuelle (admin peut accorder ou révoquer au-delà du rôle)
  const override = (user.compte as any).permissions?.find(
    (p: { pageKey: string; actionKey: string; autorise: boolean }) =>
      p.pageKey === pageKey && p.actionKey === actionKey
  );
  if (override !== undefined) return override.autorise === true;

  // Fallback sur les permissions statiques du rôle
  const role = userRole(user);
  return ROLES_PERMISSIONS[role]?.has(`${pageKey}:${actionKey}`) ?? false;
}

// ── Helpers de rôle ───────────────────────────────────────────────────────────

/** Retourne le rôle de l'utilisateur (défaut : AGENT). */
export function userRole(user: SessionUser): RoleKey {
  return (((user.compte as any).role) ?? 'AGENT') as RoleKey;
}

/** L'utilisateur a exactement ce rôle. */
export function hasRole(user: SessionUser, role: RoleKey): boolean {
  if (user.compte.estSuperAdmin) return true; // superAdmin est au-dessus de tout
  return userRole(user) === role;
}

/** L'utilisateur a au moins ce niveau de rôle dans la hiérarchie. */
export function hasRoleAtLeast(user: SessionUser, minRole: RoleKey): boolean {
  if (user.compte.estSuperAdmin) return true;
  return ROLE_HIERARCHY[userRole(user)] >= ROLE_HIERARCHY[minRole];
}

// ── Helpers contextuels ──────────────────────────────────────────────────────

/** L'utilisateur est chef de projet (chefProjetId correspond à sa personne). */
export function isChefProjet(user: SessionUser, chefProjetId: string): boolean {
  const personneId = user.personne?.id ?? null;
  return personneId !== null && personneId === chefProjetId;
}

/** L'utilisateur est assigné à cette tâche. */
export function isAssignedToTache(user: SessionUser, assigneAId: string | null | undefined): boolean {
  const personneId = user.personne?.id ?? null;
  return personneId !== null && personneId === assigneAId;
}

// ── Guards métier ─────────────────────────────────────────────────────────────

/**
 * L'utilisateur peut modifier/supprimer ce projet.
 *  - COORDINATEUR+  : toujours autorisé (permission statique).
 *  - AGENT / GESTIONNAIRE : seulement s'il est chef de projet.
 */
export function canManageProjet(user: SessionUser, chefProjetId: string): boolean {
  if (user.compte.estSuperAdmin) return true;
  if (hasRoleAtLeast(user, 'COORDINATEUR')) return true;
  return isChefProjet(user, chefProjetId);
}

/**
 * L'utilisateur peut créer/modifier/supprimer des tâches dans ce projet.
 *  - COORDINATEUR+  : toujours.
 *  - AGENT / GESTIONNAIRE : seulement s'il est chef de projet.
 */
export function canManageTaches(user: SessionUser, chefProjetId: string): boolean {
  if (user.compte.estSuperAdmin) return true;
  if (hasRoleAtLeast(user, 'COORDINATEUR')) return true;
  return isChefProjet(user, chefProjetId);
}

/**
 * L'utilisateur peut déplacer cette tâche dans le kanban (colonnes hors "Validé").
 *  - COORDINATEUR+    : toujours.
 *  - GESTIONNAIRE     : toujours (peut tout déplacer sauf Validé, qui est géré séparément).
 *  - AGENT chef       : toujours sur son projet.
 *  - AGENT assigné    : uniquement pour sa propre tâche.
 */
export function canMoveKanban(
  user: SessionUser,
  chefProjetId: string,
  assigneAId: string | null | undefined
): boolean {
  if (user.compte.estSuperAdmin) return true;
  if (hasRoleAtLeast(user, 'COORDINATEUR')) return true;
  if (hasRole(user, 'GESTIONNAIRE')) return true;
  if (isChefProjet(user, chefProjetId)) return true;
  if (isAssignedToTache(user, assigneAId)) return true;
  return false;
}

/**
 * L'utilisateur peut valider une tâche (passage au statut "Validé").
 * Réservé à GESTIONNAIRE+.
 */
export function canValiderTache(user: SessionUser): boolean {
  if (user.compte.estSuperAdmin) return true;
  return hasRoleAtLeast(user, 'GESTIONNAIRE');
}

/**
 * L'utilisateur peut commenter sur les tâches d'un projet.
 *  - GESTIONNAIRE+ : toujours.
 *  - AGENT chef    : sur son projet.
 */
export function canCommentOnProjet(user: SessionUser, chefProjetId: string): boolean {
  if (user.compte.estSuperAdmin) return true;
  if (hasRoleAtLeast(user, 'GESTIONNAIRE')) return true;
  return isChefProjet(user, chefProjetId);
}

/**
 * L'utilisateur peut gérer les comptes (créer, suspendre, modifier rôle/mdp, autorisations).
 * Réservé à ADMINISTRATEUR (et superAdmin).
 */
export function canManageComptes(user: SessionUser): boolean {
  if (user.compte.estSuperAdmin) return true;
  return hasRole(user, 'ADMINISTRATEUR');
}
