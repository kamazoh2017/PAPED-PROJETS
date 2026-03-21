import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-session';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const commentaires = await prisma.commentaireTache.findMany({
      where: { tacheId: id, parentId: null },
      include: {
        compteAcces: {
          include: { personne: true },
        },
        reponses: {
          include: {
            compteAcces: { include: { personne: true } },
          },
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
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const body = await request.json();
    if (!body?.contenu?.trim()) {
      return NextResponse.json({ error: 'Le contenu du commentaire est obligatoire.' }, { status: 400 });
    }

    // Verify task exists
    const tache = await prisma.tache.findUnique({ where: { id } });
    if (!tache) {
      return NextResponse.json({ error: 'Tâche introuvable.' }, { status: 404 });
    }

    // If parentId provided, verify it belongs to this task
    if (body.parentId) {
      const parent = await prisma.commentaireTache.findUnique({ where: { id: body.parentId } });
      if (!parent || parent.tacheId !== id) {
        return NextResponse.json({ error: 'Commentaire parent introuvable.' }, { status: 400 });
      }
    }

    const commentaire = await prisma.commentaireTache.create({
      data: {
        tacheId: id,
        compteAccesId: sessionUser.compte.id,
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
