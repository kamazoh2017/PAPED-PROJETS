import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_PASSWORD, hashPassword } from '@/lib/auth-security';

export async function GET() {
  try {
    const comptes = await prisma.compteAcces.findMany({
        where: { estSuperAdmin: false },
      include: {
        personne: {
          include: { entite: true },
        },
        _count: {
          select: { permissions: true },
        },
      },
      orderBy: { dateCreation: 'desc' },
    });

    return NextResponse.json(comptes);
  } catch {
    return NextResponse.json({ error: 'Erreur lors du chargement des comptes.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const personneId = String(body.personneId || '').trim();
    if (!personneId) {
      return NextResponse.json({ error: 'La ressource est obligatoire.' }, { status: 400 });
    }

    const personne = await prisma.personneRessource.findUnique({ where: { id: personneId } });
    if (!personne) {
      return NextResponse.json({ error: 'Ressource introuvable.' }, { status: 404 });
    }

    const existing = await prisma.compteAcces.findUnique({ where: { personneId } });
    if (existing) {
      return NextResponse.json({ error: 'Un compte existe deja pour cette ressource.' }, { status: 409 });
    }

    const passwordHash = hashPassword(DEFAULT_PASSWORD);

    const compte = await prisma.compteAcces.create({
      data: {
        personneId,
        motDePasseHash: passwordHash,
        doitChangerMdp: true,
      },
      include: {
        personne: {
          include: { entite: true },
        },
      },
    });

    return NextResponse.json(
      {
        compte,
        motDePasseParDefaut: DEFAULT_PASSWORD,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la creation du compte.' }, { status: 500 });
  }
}
