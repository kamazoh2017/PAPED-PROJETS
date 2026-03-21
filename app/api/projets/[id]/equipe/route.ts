import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body?.membreId) {
      return NextResponse.json({ error: 'membreId est obligatoire.' }, { status: 400 });
    }

    const projet = await prisma.projet.update({
      where: { id },
      data: { equipeProjet: { connect: { id: body.membreId } } },
      include: { equipeProjet: { include: { entite: true } } },
    });

    return NextResponse.json(projet);
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'ajout du membre" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body?.membreId) {
      return NextResponse.json({ error: 'membreId est obligatoire.' }, { status: 400 });
    }

    const projet = await prisma.projet.update({
      where: { id },
      data: { equipeProjet: { disconnect: { id: body.membreId } } },
      include: { equipeProjet: { include: { entite: true } } },
    });

    return NextResponse.json(projet);
  } catch {
    return NextResponse.json({ error: 'Erreur lors du retrait du membre' }, { status: 500 });
  }
}
