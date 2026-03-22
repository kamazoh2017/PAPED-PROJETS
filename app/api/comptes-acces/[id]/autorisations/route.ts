import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { flattenPermissions, PERMISSIONS_CATALOG } from '@/lib/permissions-catalog';
import { requireAuth, canDo, forbidden } from '@/lib/require-auth';

type Params = { params: Promise<{ id: string }> };

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

    // Build flat granted map from stored permissions
    const granted: Record<string, boolean> = {};
    compte.permissions.forEach(p => {
      granted[`${p.pageKey}:${p.actionKey}`] = p.autorise;
    });

    // Ensure every possible key is present (default false)
    flattenPermissions(PERMISSIONS_CATALOG).forEach(({ pageKey, actionKey }) => {
      const k = `${pageKey}:${actionKey}`;
      if (!(k in granted)) granted[k] = false;
    });

    return NextResponse.json({ compte, granted });
  } catch {
    return NextResponse.json({ error: 'Erreur lors du chargement des autorisations.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'comptes-acces', 'manage-authz')) return forbidden();

  try {
    const { id } = await params;
    const body = await request.json();
    const permissions = Array.isArray(body.permissions) ? body.permissions : [];

    const compte = await prisma.compteAcces.findUnique({ where: { id } });
    if (!compte) return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });

    await prisma.$transaction([
      prisma.permissionPageAction.deleteMany({ where: { compteId: id } }),
      prisma.permissionPageAction.createMany({
        data: permissions.map((perm: { pageKey: string; actionKey: string; autorise: boolean }) => ({
          compteId: id,
          pageKey:   String(perm.pageKey),
          actionKey: String(perm.actionKey),
          autorise:  Boolean(perm.autorise),
        })),
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde des autorisations.' }, { status: 500 });
  }
}
