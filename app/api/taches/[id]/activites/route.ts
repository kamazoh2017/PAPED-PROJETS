import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { err } = await requireAuth(request);
  if (err) return err;

  try {
    const { id } = await params;
    const activites = await prisma.activiteTache.findMany({
      where: { tacheId: id },
      include: {
        compte: {
          select: {
            login: true,
            personne: { select: { nom: true, prenoms: true } },
          },
        },
      },
      orderBy: { dateCreation: 'desc' },
    });
    return NextResponse.json(activites);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la récupération de l\'historique.' }, { status: 500 });
  }
}
