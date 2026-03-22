import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, canDo, forbidden } from '@/lib/require-auth';
import { hashPassword } from '@/lib/auth-security';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { user, err } = await requireAuth(request);
  if (err) return err;

  try {
    const { id } = await params;
    const body = await request.json();

    const compte = await prisma.compteAcces.findUnique({ where: { id } });
    if (!compte) return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
    if (compte.estSuperAdmin) {
      return NextResponse.json({ error: 'Impossible de modifier un super administrateur.' }, { status: 403 });
    }

    // Vérifier la permission selon l'opération
    if (typeof body.estActif === 'boolean' && !canDo(user, 'comptes-acces', 'suspend')) return forbidden();
    if (typeof body.motDePasse === 'string' && !canDo(user, 'comptes-acces', 'change-password')) return forbidden();

    const updates: Record<string, unknown> = {};
    if (typeof body.estActif === 'boolean') updates.estActif = body.estActif;

    if (typeof body.motDePasse === 'string') {
      const mdp = body.motDePasse.trim();
      if (mdp.length < 6) {
        return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' }, { status: 400 });
      }
      updates.motDePasseHash = hashPassword(mdp);
      updates.doitChangerMdp = true;
    }

    const updated = await prisma.compteAcces.update({ where: { id }, data: updates });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour.' }, { status: 500 });
  }
}
