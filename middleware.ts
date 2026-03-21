import { NextRequest, NextResponse } from 'next/server';

// Doit rester identique à SESSION_COOKIE dans lib/auth-session.ts
// (impossible d'importer auth-session.ts ici : il utilise Prisma, incompatible avec le runtime Edge)
const SESSION_COOKIE = 'pape_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Seules les routes /api/ sont concernées
  if (!pathname.startsWith('/api/')) return NextResponse.next();

  // Routes d'authentification : publiques (login, logout, me, change-password)
  if (pathname.startsWith('/api/auth/')) return NextResponse.next();

  // Toutes les autres routes API nécessitent un cookie de session
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
