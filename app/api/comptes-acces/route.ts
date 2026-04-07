import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_PASSWORD, hashPassword } from '@/lib/auth-security';
import { requireAuth, canDo, forbidden, canManageComptes } from '@/lib/require-auth';
import { getDefaultPermissions, type RoleKey } from '@/lib/roles-permissions';
import { flattenPermissions, PERMISSIONS_CATALOG } from '@/lib/permissions-catalog';

const ALL_PERMISSIONS = flattenPermissions(PERMISSIONS_CATALOG);
const VALID_ROLES: RoleKey[] = ['AGENT', 'GESTIONNAIRE', 'COORDINATEUR', 'ADMINISTRATEUR'];

export async function GET(request: NextRequest) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'comptes-acces', 'view')) return forbidden();

  try {
    const comptes = await prisma.compteAcces.findMany({
      where: { estSuperAdmin: false },
      include: {
        personne: { include: { entite: true } },
        _count:   { select: { permissions: true } },
      },
      orderBy: { dateCreation: 'desc' },
    });
    return NextResponse.json(comptes);
  } catch {
    return NextResponse.json({ error: 'Erreur lors du chargement des comptes.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  // Créer un compte : ADMINISTRATEUR uniquement
  if (!canManageComptes(user)) return forbidden();

  try {
    const body = await request.json();
    const personneId = String(body.personneId || '').trim();
    if (!personneId) {
      return NextResponse.json({ error: 'La ressource est obligatoire.' }, { status: 400 });
    }

    const role: RoleKey = VALID_ROLES.includes(body.role) ? body.role : 'AGENT';

    const personne = await prisma.personneRessource.findUnique({ where: { id: personneId } });
    if (!personne) {
      return NextResponse.json({ error: 'Ressource introuvable.' }, { status: 404 });
    }

    const existing = await prisma.compteAcces.findUnique({ where: { personneId } });
    if (existing) {
      return NextResponse.json({ error: 'Un compte existe déjà pour cette ressource.' }, { status: 409 });
    }

    const passwordHash = hashPassword(DEFAULT_PASSWORD);
    const defaultPerms = getDefaultPermissions(role);

    // Créer le compte et ses permissions par défaut en une transaction
    const compte = await prisma.$transaction(async (tx) => {
      const c = await tx.compteAcces.create({
        data: {
          personneId,
          role,
          motDePasseHash: passwordHash,
          doitChangerMdp: true,
        },
        include: { personne: { include: { entite: true } } },
      });

      // Pré-populer les permissions selon le rôle
      const allPermsData = ALL_PERMISSIONS.map(({ pageKey, actionKey }) => ({
        compteId:  c.id,
        pageKey,
        actionKey,
        autorise: defaultPerms.some(p => p.pageKey === pageKey && p.actionKey === actionKey),
      }));

      await tx.permissionPageAction.createMany({ data: allPermsData });
      return c;
    });

    return NextResponse.json({ compte, motDePasseParDefaut: DEFAULT_PASSWORD }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la création du compte.' }, { status: 500 });
  }
}
