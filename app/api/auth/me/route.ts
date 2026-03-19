import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-session';

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: 'Non authentifie.' }, { status: 401 });
    }

    return NextResponse.json({
      id: sessionUser.compte.id,
      email: sessionUser.compte.estSuperAdmin ? sessionUser.compte.login : sessionUser.personne?.email,
      personne: sessionUser.personne ?? null,
      estSuperAdmin: sessionUser.compte.estSuperAdmin,
      doitChangerMdp: sessionUser.compte.doitChangerMdp,
    });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la lecture de session.' }, { status: 500 });
  }
}
