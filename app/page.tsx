import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE } from '@/lib/auth-session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      redirect('/accueil');
    }

    const session = await prisma.sessionAuth.findUnique({
      where: { token },
      select: { id: true, expireLe: true },
    });

    if (!session) {
      redirect('/accueil');
    }

    if (session.expireLe.getTime() <= Date.now()) {
      await prisma.sessionAuth.delete({ where: { id: session.id } });
      redirect('/accueil');
    }

    redirect('/tableau-de-bord');
  } catch {
    redirect('/accueil');
  }
}
