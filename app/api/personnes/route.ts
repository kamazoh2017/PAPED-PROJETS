import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const personnes = await prisma.personneRessource.findMany({
      include: {
        entite: true,
      },
    });
    return NextResponse.json(personnes);
  } catch (error) {
    console.error('API /api/personnes GET failed:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const personne = await prisma.personneRessource.create({
      data: {
        nom: body.nom,
        prenoms: body.prenoms,
        telephone: body.telephone,
        email: body.email,
        fonction: body.fonction,
        entiteId: body.entiteId,
        estChefProjet: body.estChefProjet || false,
      },
      include: {
        entite: true,
      },
    });
    return NextResponse.json(personne, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la création de la personne' }, { status: 500 });
  }
}
