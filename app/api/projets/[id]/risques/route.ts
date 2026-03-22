import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

function graviteFromScore(score: number): string {
  if (score <= 25) return 'Faible';
  if (score <= 50) return 'Moyen';
  if (score <= 75) return 'Élevé';
  return 'Critique';
}

function couleurFromGravite(gravite: string): string {
  if (gravite === 'Moyen') return 'Jaune';
  if (gravite === 'Élevé') return 'Orange';
  if (gravite === 'Critique') return 'Rouge';
  return 'Vert';
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const risques = await prisma.risqueProjet.findMany({
      where: { projetId: id },
      orderBy: { libelle: 'asc' },
    });
    return NextResponse.json(risques);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la récupération des risques' }, { status: 500 });
  }
}

/**
 * POST /api/projets/[id]/risques
 * Reçoit les scores calculés par le dashboard et les persiste par upsert.
 * Body : { retard, horsDelai, progression, suspendu, global } (nombres 0–100)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const indicateurs = [
      { libelle: 'retard',      taux: Number(body.retard      ?? 0) },
      { libelle: 'horsDelai',   taux: Number(body.horsDelai   ?? 0) },
      { libelle: 'progression', taux: Number(body.progression ?? 0) },
      { libelle: 'suspendu',    taux: Number(body.suspendu    ?? 0) },
      { libelle: 'global',      taux: Number(body.global      ?? 0) },
    ].map(({ libelle, taux }) => {
      const gravite = graviteFromScore(taux);
      return { libelle, taux, gravite, couleur: couleurFromGravite(gravite) };
    });

    await prisma.$transaction(
      indicateurs.map(({ libelle, taux, gravite, couleur }) =>
        prisma.risqueProjet.upsert({
          where: { projetId_libelle: { projetId: id, libelle } },
          update: { taux, gravite, couleur },
          create: { projetId: id, libelle, taux, gravite, couleur },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la persistance des risques' }, { status: 500 });
  }
}
