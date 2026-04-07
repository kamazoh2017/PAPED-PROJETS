import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, forbidden, canCommentOnProjet } from '@/lib/require-auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const commentaires = await prisma.commentaireTache.findMany({
      where: { tacheId: id, parentId: null },
      include: {
        compteAcces: { include: { personne: true } },
        reponses: {
          include: { compteAcces: { include: { personne: true } } },
          orderBy: { dateCreation: 'asc' },
        },
      },
      orderBy: { dateCreation: 'asc' },
    });
    return NextResponse.json(commentaires);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la récupération des commentaires' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, err } = await requireAuth(request);
  if (err) return err;

  try {
    const { id } = await params;
    const body = await request.json();

    if (!body?.contenu?.trim()) {
      return NextResponse.json({ error: 'Le contenu du commentaire est obligatoire.' }, { status: 400 });
    }

    const tache = await prisma.tache.findUnique({
      where: { id },
      select: { projet: { select: { chefProjetId: true } } },
    });
    if (!tache) {
      return NextResponse.json({ error: 'Tâche introuvable.' }, { status: 404 });
    }

    // GESTIONNAIRE+ (statique) OU chef de projet (contextuel)
    if (!canCommentOnProjet(user, tache.projet.chefProjetId)) return forbidden();

    if (body.parentId) {
      const parent = await prisma.commentaireTache.findUnique({ where: { id: body.parentId } });
      if (!parent || parent.tacheId !== id) {
        return NextResponse.json({ error: 'Commentaire parent introuvable.' }, { status: 400 });
      }
    }

    const commentaire = await prisma.commentaireTache.create({
      data: {
        tacheId: id,
        compteAccesId: user.compte.id,
        contenu: body.contenu.trim(),
        parentId: body.parentId ?? null,
      },
      include: {
        compteAcces: { include: { personne: true } },
        reponses: { include: { compteAcces: { include: { personne: true } } } },
      },
    });

    return NextResponse.json(commentaire, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la création du commentaire' }, { status: 500 });
  }
}
