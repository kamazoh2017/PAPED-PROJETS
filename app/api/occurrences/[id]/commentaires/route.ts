import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canDo, forbidden } from '@/lib/require-auth';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;
  if (!canDo(user, 'operations', 'update')) return forbidden();

  try {
    const { id: occurrenceId } = await params;
    const body = await request.json();

    const contenu = String(body.contenu || '').trim();
    if (!contenu) return NextResponse.json({ error: 'Le contenu est obligatoire.' }, { status: 400 });

    const occurrence = await prisma.occurrenceTache.findUnique({
      where: { id: occurrenceId },
      select: { id: true },
    });
    if (!occurrence) return NextResponse.json({ error: 'Occurrence non trouvée.' }, { status: 404 });

    const commentaire = await prisma.commentaireOccurrence.create({
      data: {
        occurrenceId,
        compteAccesId: user.compte.id,
        contenu,
        parentId: body.parentId ? String(body.parentId) : null,
      },
      include: {
        compteAcces: { select: { id: true, login: true, personne: { select: { nom: true, prenoms: true } } } },
      },
    });
    return NextResponse.json(commentaire, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de l\'ajout du commentaire.' }, { status: 500 });
  }
}
