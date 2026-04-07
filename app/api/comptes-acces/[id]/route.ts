import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, canDo, forbidden, canManageComptes } from '@/lib/require-auth';
import { hashPassword } from '@/lib/auth-security';
import { getDefaultPermissions, type RoleKey } from '@/lib/roles-permissions';
import { flattenPermissions, PERMISSIONS_CATALOG } from '@/lib/permissions-catalog';

type Params = { params: Promise<{ id: string }> };

const ALL_PERMISSIONS = flattenPermissions(PERMISSIONS_CATALOG);
const VALID_ROLES: RoleKey[] = ['AGENT', 'GESTIONNAIRE', 'COORDINATEUR', 'ADMINISTRATEUR'];

export async function PATCH(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;

  try {
    const { id } = await params;
    const body = await request.json();

    const compte = await prisma.compteAcces.findUnique({ where: { id } });
    if (!compte) return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
    if (compte.estSuperAdmin) {
      return NextResponse.json({ error: 'Impossible de modifier un super administrateur.' }, { status: 403 });
    }

    // Toutes les actions de modification de compte nécessitent ADMINISTRATEUR
    if (!canManageComptes(user)) return forbidden();

    // Vérifier les permissions spécifiques selon l'opération
    if (typeof body.estActif === 'boolean' && !canDo(user, 'comptes-acces', 'suspend')) return forbidden();
    if (typeof body.motDePasse === 'string' && !canDo(user, 'comptes-acces', 'change-password')) return forbidden();

    const updates: Record<string, unknown> = {};

    if (typeof body.estActif === 'boolean') {
      updates.estActif = body.estActif;
    }

    if (typeof body.motDePasse === 'string') {
      const mdp = body.motDePasse.trim();
      if (mdp.length < 6) {
        return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' }, { status: 400 });
      }
      updates.motDePasseHash = hashPassword(mdp);
      updates.doitChangerMdp = true;
    }

    // Changement de rôle → reset des permissions vers les défauts du nouveau rôle
    if (typeof body.role === 'string' && VALID_ROLES.includes(body.role as RoleKey)) {
      const newRole = body.role as RoleKey;
      updates.role = newRole;

      const defaultPerms = getDefaultPermissions(newRole);
      const allPermsData = ALL_PERMISSIONS.map(({ pageKey, actionKey }) => ({
        compteId:  id,
        pageKey,
        actionKey,
        autorise: defaultPerms.some(p => p.pageKey === pageKey && p.actionKey === actionKey),
      }));

      // Reset des permissions dans la même transaction que la mise à jour du rôle
      await prisma.$transaction([
        prisma.compteAcces.update({ where: { id }, data: updates }),
        prisma.permissionPageAction.deleteMany({ where: { compteId: id } }),
        prisma.permissionPageAction.createMany({ data: allPermsData }),
      ]);

      const updated = await prisma.compteAcces.findUnique({ where: { id } });
      return NextResponse.json(updated);
    }

    const updated = await prisma.compteAcces.update({ where: { id }, data: updates });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour.' }, { status: 500 });
  }
}
