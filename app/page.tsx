import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE } from '@/lib/auth-session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  // Déterminer la destination AVANT d'appeler redirect().
  // redirect() lance une exception NEXT_REDIRECT — l'appeler dans un try/catch
  // ferait attraper sa propre exception par le catch, causant une boucle vers /accueil.
  let destination = '/accueil';

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (token) {
      const session = await prisma.sessionAuth.findUnique({
        where: { token },
        select: { id: true, expireLe: true },
      });

      if (session) {
        if (session.expireLe.getTime() <= Date.now()) {
          await prisma.sessionAuth.delete({ where: { id: session.id } });
        } else {
          destination = '/tableau-de-bord';
        }
      }
    }
  } catch {
    // En cas d'erreur DB, on redirige vers /accueil (destination par défaut)
  }

  redirect(destination);
}
