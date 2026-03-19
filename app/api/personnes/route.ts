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

    const nom = String(body.nom || '').trim();
    const prenoms = String(body.prenoms || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const fonction = String(body.fonction || '').trim();
    const entiteId = String(body.entiteId || '').trim();
    const telephone = String(body.telephone || '').replace(/\D/g, '');

    if (!nom || !prenoms || !email || !fonction || !entiteId) {
      return NextResponse.json({ error: 'Tous les champs obligatoires doivent etre renseignes.' }, { status: 400 });
    }

    if (telephone.length !== 10) {
      return NextResponse.json({ error: 'Le numero de telephone doit contenir exactement 10 chiffres.' }, { status: 400 });
    }

    const existing = await prisma.personneRessource.findFirst({
      where: {
        OR: [{ email }, { telephone }],
      },
      select: {
        id: true,
        email: true,
        telephone: true,
      },
    });

    if (existing) {
      if (existing.email === email) {
        return NextResponse.json({ error: 'Une ressource existe deja avec cet email.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Une ressource existe deja avec ce numero de telephone.' }, { status: 409 });
    }

    const personne = await prisma.personneRessource.create({
      data: {
        nom,
        prenoms,
        telephone,
        email,
        fonction,
        entiteId,
        estChefProjet: body.estChefProjet || false,
      },
      include: {
        entite: true,
      },
    });
    return NextResponse.json(personne, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la création de la personne' }, { status: 500 });
  }
}
