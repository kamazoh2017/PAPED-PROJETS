import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, forbidden, canManageTaches } from '@/lib/require-auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { err } = await requireAuth(request);
  if (err) return err;

  const sousTaches = await (prisma as any).sousTache.findMany({
    where: { tacheId: id },
    orderBy: [{ ordre: 'asc' }, { dateCreation: 'asc' }],
  });
  return NextResponse.json(sousTaches);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, err } = await requireAuth(request);
  if (err) return err;

  const tache = await prisma.tache.findUnique({
    where: { id },
    include: { projet: { select: { chefProjetId: true } } },
  });
  if (!tache) return NextResponse.json({ error: 'Tâche introuvable.' }, { status: 404 });
  if (!canManageTaches(user, tache.projet.chefProjetId)) return forbidden();

  const body = await request.json();
  const libelle = String(body?.libelle ?? '').trim();
  if (!libelle) return NextResponse.json({ error: 'Libellé requis.' }, { status: 400 });

  const last = await (prisma as any).sousTache.findFirst({
    where: { tacheId: id },
    orderBy: { ordre: 'desc' },
    select: { ordre: true },
  });

  const st = await (prisma as any).sousTache.create({
    data: { tacheId: id, libelle, ordre: (last?.ordre ?? 0) + 1 },
  });
  return NextResponse.json(st, { status: 201 });
}
