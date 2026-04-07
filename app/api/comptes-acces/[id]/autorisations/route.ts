import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { flattenPermissions, PERMISSIONS_CATALOG } from '@/lib/permissions-catalog';
import { requireAuth, canDo, forbidden, canManageComptes } from '@/lib/require-auth';
import { getDefaultPermissions, roleHasPermission, type RoleKey } from '@/lib/roles-permissions';

type Params = { params: Promise<{ id: string }> };

const ALL_PERMISSIONS = flattenPermissions(PERMISSIONS_CATALOG);

export async function GET(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'comptes-acces', 'view')) return forbidden();

  try {
    const { id } = await params;

    const compte = await prisma.compteAcces.findUnique({
      where: { id },
      include: { personne: { include: { entite: true } }, permissions: true },
    });
    if (!compte) return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });

    const role = ((compte as any).role ?? 'AGENT') as RoleKey;

    // Permissions effectives (override individuel OU défaut du rôle)
    const overrides: Record<string, boolean> = {};
    compte.permissions.forEach(p => { overrides[`${p.pageKey}:${p.actionKey}`] = p.autorise; });

    // granted = valeur effective pour l'UI (surcharge si présente, sinon rôle)
    const granted: Record<string, boolean> = {};
    // roleDefaults = ce que le rôle accorde sans surcharge (pour affichage dans l'UI)
    const roleDefaults: Record<string, boolean> = {};
    // isOverridden = indique si la valeur provient d'une surcharge individuelle
    const isOverridden: Record<string, boolean> = {};

    ALL_PERMISSIONS.forEach(({ pageKey, actionKey }) => {
      const key = `${pageKey}:${actionKey}`;
      const roleDef = roleHasPermission(role, pageKey, actionKey);
      roleDefaults[key] = roleDef;

      if (key in overrides) {
        granted[key]     = overrides[key];
        isOverridden[key] = overrides[key] !== roleDef; // marquer si diff du rôle
      } else {
        granted[key]      = roleDef;
        isOverridden[key] = false;
      }
    });

    return NextResponse.json({ compte, role, granted, roleDefaults, isOverridden });
  } catch {
    return NextResponse.json({ error: 'Erreur lors du chargement des autorisations.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  // Modifier les autorisations : ADMINISTRATEUR uniquement
  if (!canManageComptes(user)) return forbidden();

  try {
    const { id } = await params;
    const body = await request.json();
    const permissions = Array.isArray(body.permissions) ? body.permissions : [];

    const compte = await prisma.compteAcces.findUnique({ where: { id } });
    if (!compte) return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });

    const role = ((compte as any).role ?? 'AGENT') as RoleKey;

    // On ne stocke QUE les surcharges (permissions différentes du défaut du rôle)
    // Cela évite de dupliquer ce que le rôle accorde déjà
    const overrides = permissions
      .map((perm: { pageKey: string; actionKey: string; autorise: boolean }) => ({
        compteId:  id,
        pageKey:   String(perm.pageKey),
        actionKey: String(perm.actionKey),
        autorise:  Boolean(perm.autorise),
      }))
      .filter((p: { pageKey: string; actionKey: string; autorise: boolean }) => {
        const isDiff = p.autorise !== roleHasPermission(role, p.pageKey, p.actionKey);
        return isDiff; // ne stocker que si différent du défaut du rôle
      });

    await prisma.$transaction([
      prisma.permissionPageAction.deleteMany({ where: { compteId: id } }),
      prisma.permissionPageAction.createMany({ data: overrides }),
    ]);

    return NextResponse.json({ success: true, overridesCount: overrides.length });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde des autorisations.' }, { status: 500 });
  }
}
