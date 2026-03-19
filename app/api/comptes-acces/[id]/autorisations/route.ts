import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PERMISSIONS_CATALOG } from '@/lib/permissions-catalog';

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const compte = await prisma.compteAcces.findUnique({
      where: { id },
      include: {
        personne: {
          include: { entite: true },
        },
        permissions: true,
      },
    });

    if (!compte) {
      return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
    }

    const map = new Map<string, boolean>();
    compte.permissions.forEach((p) => map.set(`${p.pageKey}:${p.actionKey}`, p.autorise));

    const pages = PERMISSIONS_CATALOG.map((page) => ({
      key: page.key,
      label: page.label,
      actions: page.actions.map((action) => ({
        key: action.key,
        label: action.label,
        autorise: map.get(`${page.key}:${action.key}`) ?? false,
      })),
    }));

    return NextResponse.json({ compte, pages });
  } catch {
    return NextResponse.json({ error: 'Erreur lors du chargement des autorisations.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const permissions = Array.isArray(body.permissions) ? body.permissions : [];

    const compte = await prisma.compteAcces.findUnique({ where: { id } });
    if (!compte) {
      return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
    }

    await prisma.$transaction(
      permissions.map((perm: { pageKey: string; actionKey: string; autorise: boolean }) =>
        prisma.permissionPageAction.upsert({
          where: {
            compteId_pageKey_actionKey: {
              compteId: id,
              pageKey: String(perm.pageKey),
              actionKey: String(perm.actionKey),
            },
          },
          update: {
            autorise: Boolean(perm.autorise),
          },
          create: {
            compteId: id,
            pageKey: String(perm.pageKey),
            actionKey: String(perm.actionKey),
            autorise: Boolean(perm.autorise),
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde des autorisations.' }, { status: 500 });
  }
}
