import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSessionToken, verifyPassword } from '@/lib/auth-security';
import { SESSION_COOKIE } from '@/lib/auth-session';

const SESSION_HOURS = 8;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier || body.email || '').trim();
    const email = identifier.toLowerCase();
    const telephone = identifier.replace(/\D/g, '');
    const password = String(body.password || '');

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Identifiant (telephone ou email) et mot de passe obligatoires.' },
        { status: 400 }
      );
    }

    const whereClauses: Array<Record<string, unknown>> = [
      { login: email, estSuperAdmin: true },
      { personne: { email }, estSuperAdmin: false },
    ];

    if (telephone.length === 10) {
      whereClauses.push({ personne: { telephone }, estSuperAdmin: false });
    }

    const compte = await prisma.compteAcces.findFirst({
      where: {
        OR: whereClauses,
      },
      include: {
        personne: {
          include: { entite: true },
        },
      },
    });

    if (!compte || !compte.estActif) {
      return NextResponse.json({ error: 'Identifiants invalides.' }, { status: 401 });
    }

    const ok = verifyPassword(password, compte.motDePasseHash);
    if (!ok) {
      return NextResponse.json({ error: 'Identifiants invalides.' }, { status: 401 });
    }

    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.sessionAuth.create({
        data: {
          compteId: compte.id,
          token,
          expireLe: expiresAt,
        },
      }),
      prisma.compteAcces.update({
        where: { id: compte.id },
        data: { dateDerniereConnex: new Date() },
      }),
    ]);

    const response = NextResponse.json({
      id: compte.id,
      email: compte.estSuperAdmin ? compte.login : compte.personne?.email,
      personne: compte.personne ?? null,
      estSuperAdmin: compte.estSuperAdmin,
      doitChangerMdp: compte.doitChangerMdp,
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: expiresAt,
    });

    return response;
  } catch (err) {
    console.error('[login] erreur:', err);
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    return NextResponse.json(
      { error: 'Erreur lors de la connexion.', debug: { message, stack, hasDbUrl: !!process.env.DATABASE_URL, dbProtocol: (process.env.DATABASE_URL || '').split('://')[0] } },
      { status: 500 }
    );
  }
}
