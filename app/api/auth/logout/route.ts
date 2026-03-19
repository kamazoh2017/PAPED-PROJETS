import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE } from '@/lib/auth-session';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (token) {
      await prisma.sessionAuth.deleteMany({ where: { token } });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete(SESSION_COOKIE);
    return response;
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la deconnexion.' }, { status: 500 });
  }
}
