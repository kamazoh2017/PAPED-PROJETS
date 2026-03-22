import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-session';

type Params = { params: Promise<{ id: string; commentaireId: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const sessionUser = await getSessionUser(request);
  if (!sessionUser) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  try {
    const { id, commentaireId } = await params;
    const body = await request.json();
    const contenu = String(body.contenu ?? '').trim();
    if (!contenu) return NextResponse.json({ error: 'Le contenu ne peut pas être vide.' }, { status: 400 });

    const comment = await prisma.commentaireTache.findUnique({ where: { id: commentaireId } });
    if (!comment || comment.tacheId !== id) {
      return NextResponse.json({ error: 'Commentaire introuvable.' }, { status: 404 });
    }
    if (comment.compteAccesId !== sessionUser.compte.id) {
      return NextResponse.json({ error: 'Vous ne pouvez modifier que vos propres commentaires.' }, { status: 403 });
    }

    const updated = await prisma.commentaireTache.update({
      where: { id: commentaireId },
      data: { contenu },
      include: {
        compteAcces: { include: { personne: true } },
        reponses: { include: { compteAcces: { include: { personne: true } } } },
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la modification.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const sessionUser = await getSessionUser(request);
  if (!sessionUser) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });

  try {
    const { id, commentaireId } = await params;
    const comment = await prisma.commentaireTache.findUnique({ where: { id: commentaireId } });
    if (!comment || comment.tacheId !== id) {
      return NextResponse.json({ error: 'Commentaire introuvable.' }, { status: 404 });
    }
    if (comment.compteAccesId !== sessionUser.compte.id && !sessionUser.compte.estSuperAdmin) {
      return NextResponse.json({ error: 'Vous ne pouvez supprimer que vos propres commentaires.' }, { status: 403 });
    }

    await prisma.commentaireTache.delete({ where: { id: commentaireId } });
    return NextResponse.json({ message: 'Commentaire supprimé.' });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la suppression.' }, { status: 500 });
  }
}
