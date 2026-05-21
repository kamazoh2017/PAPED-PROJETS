import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, forbidden, hasRoleAtLeast } from '@/lib/require-auth';

const TABLES_AUTORISEES = new Set([
  'Projet',
  'Tache',
  'SousTache',
  'RisqueProjet',
  'PartiePrenante',
  'Operation',
  'TacheOperationnelle',
  'OccurrenceTache',
  'CompteAcces',
  'PersonneRessource',
  'Entite',
  'Programme',
  'ResultatAttendu',
  'Activite',
]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string; id: string }> }
) {
  const { user, err } = await requireAuth(request);
  if (err) return err;

  if (!user.compte.estSuperAdmin && !hasRoleAtLeast(user, 'COORDINATEUR')) {
    return forbidden();
  }

  const { table, id } = await params;

  if (!TABLES_AUTORISEES.has(table)) {
    return NextResponse.json({ error: 'Table non autorisée.' }, { status: 400 });
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 500);

  const entrees = await prisma.historiqueModification.findMany({
    where: { table, enregistrementId: id },
    orderBy: { dateCree: 'desc' },
    take: limit,
  });

  return NextResponse.json({
    table,
    enregistrementId: id,
    count: entrees.length,
    entries: entrees.map((e) => ({
      id: e.id,
      action: e.action,
      login: e.login,
      compteId: e.compteId,
      dateCree: e.dateCree,
      avant: e.avant ? safeParse(e.avant) : null,
      apres: e.apres ? safeParse(e.apres) : null,
    })),
  });
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
