import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const SESSION_COOKIE = 'pape_session';

export async function getSessionUser(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.sessionAuth.findUnique({
    where: { token },
    include: {
      compte: {
        include: {
          personne: {
            include: { entite: true },
          },
        },
      },
    },
  });

  if (!session) return null;
  if (session.expireLe.getTime() <= Date.now()) {
    await prisma.sessionAuth.delete({ where: { id: session.id } });
    return null;
  }

  return {
    token,
    session,
    compte: session.compte,
    personne: session.compte.personne ?? null,
  };
}
