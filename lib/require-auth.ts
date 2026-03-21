import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from './auth-session';

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

export function unauthorized() {
  return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
}

export async function requireAuth(
  request: NextRequest
): Promise<{ user: SessionUser; err: null } | { user: null; err: NextResponse }> {
  const user = await getSessionUser(request);
  if (!user) return { user: null, err: unauthorized() };
  return { user, err: null };
}

export function canDo(user: SessionUser, pageKey: string, actionKey: string): boolean {
  if (user.compte.estSuperAdmin) return true;
  const perm = (user.compte as any).permissions?.find(
    (p: { pageKey: string; actionKey: string; autorise: boolean }) =>
      p.pageKey === pageKey && p.actionKey === actionKey
  );
  return perm?.autorise === true;
}
