import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden } from '@/lib/require-auth';

type Params = { params: Promise<{ id: string; ppId: string }> };

const PP_INCLUDE = {
  ressource: { include: { entite: true } },
  acteurCollectif: true,
} as const;

export async function PATCH(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'detail-projet', 'edit-info')) return forbidden();

  try {
    const { ppId } = await params;
    const body = await request.json();

    const pp = await prisma.partiePrenante.update({
      where: { id: ppId },
      data: {
        role:                   body.role                   !== undefined ? String(body.role)                   : undefined,
        influence:              body.influence              !== undefined ? String(body.influence)              : undefined,
        interet:                body.interet                !== undefined ? String(body.interet)                : undefined,
        attentesTexte:          body.attentesTexte          !== undefined ? (body.attentesTexte || null)        : undefined,
        strategieCommunication: body.strategieCommunication !== undefined ? (body.strategieCommunication || null) : undefined,
        notes:                  body.notes                  !== undefined ? (body.notes || null)                : undefined,
      },
      include: PP_INCLUDE,
    });
    return NextResponse.json(pp);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'detail-projet', 'edit-info')) return forbidden();

  try {
    const { ppId } = await params;
    await prisma.partiePrenante.delete({ where: { id: ppId } });
    return NextResponse.json({ message: 'Partie prenante supprimée.' });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 });
  }
}
