import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-session';
import { hashPassword, verifyPassword } from '@/lib/auth-security';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
    }

    const body = await request.json();
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Les deux mots de passe sont obligatoires.' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caracteres.' }, { status: 400 });
    }

    const ok = verifyPassword(currentPassword, sessionUser.compte.motDePasseHash);
    if (!ok) {
      return NextResponse.json({ error: 'Mot de passe actuel incorrect.' }, { status: 401 });
    }

    await prisma.compteAcces.update({
      where: { id: sessionUser.compte.id },
      data: {
        motDePasseHash: hashPassword(newPassword),
        doitChangerMdp: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur lors du changement de mot de passe.' }, { status: 500 });
  }
}
