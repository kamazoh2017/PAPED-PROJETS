import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, forbidden, canManageTaches } from '@/lib/require-auth';

async function resolveChef(tacheId: string): Promise<string> {
  const t = await prisma.tache.findUnique({
    where: { id: tacheId },
    include: { projet: { select: { chefProjetId: true } } },
  });
  return t?.projet.chefProjetId ?? '';
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stId: string }> },
) {
  const { id, stId } = await params;
  const { user, err } = await requireAuth(request);
  if (err) return err;

  const st = await (prisma as any).sousTache.findUnique({ where: { id: stId } });
  if (!st || st.tacheId !== id) return NextResponse.json({ error: 'Introuvable.' }, { status: 404 });

  const body = await request.json();
  const isToggle = Object.keys(body).length === 1 && 'estFaite' in body;

  if (!isToggle) {
    const chefId = await resolveChef(id);
    if (!canManageTaches(user, chefId)) return forbidden();
  }

  const updated = await (prisma as any).sousTache.update({
    where: { id: stId },
    data: {
      ...(body.estFaite !== undefined ? { estFaite: Boolean(body.estFaite) } : {}),
      ...(body.libelle !== undefined ? { libelle: String(body.libelle).trim() } : {}),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stId: string }> },
) {
  const { id, stId } = await params;
  const { user, err } = await requireAuth(request);
  if (err) return err;

  const st = await (prisma as any).sousTache.findUnique({ where: { id: stId } });
  if (!st || st.tacheId !== id) return NextResponse.json({ error: 'Introuvable.' }, { status: 404 });

  const chefId = await resolveChef(id);
  if (!canManageTaches(user, chefId)) return forbidden();

  await (prisma as any).sousTache.delete({ where: { id: stId } });
  return NextResponse.json({ ok: true });
}
