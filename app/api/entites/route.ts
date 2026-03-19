import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const entites = await prisma.entite.findMany({
      include: {
        personnesRessources: true,
        partiesPrenantes: true,
      },
    });
    return NextResponse.json(entites);
  } catch (error) {
    console.error('API /api/entites GET failed:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entite = await prisma.entite.create({
      data: {
        libelle: body.libelle,
        tutelle: body.tutelle,
      },
      include: {
        personnesRessources: true,
        partiesPrenantes: true,
      },
    });
    return NextResponse.json(entite, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la création de l\'entité' }, { status: 500 });
  }
}
