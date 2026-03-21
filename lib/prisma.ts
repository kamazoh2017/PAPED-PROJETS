import { PrismaClient } from '@prisma/client';
import { auditStorage } from './audit-context';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ── Modèles exclus de l'historisation ──────────────────────────────────────
// HistoriqueModification : évite la boucle infinie
// SessionAuth            : trop volatile (connexions/déconnexions)
// ActiviteTache          : déjà un journal métier
const AUDIT_EXCLUDED = new Set(['HistoriqueModification', 'SessionAuth', 'ActiviteTache']);

// ── Middleware d'audit ─────────────────────────────────────────────────────
prisma.$use(async (params, next) => {
  if (!params.model || AUDIT_EXCLUDED.has(params.model)) return next(params);

  const ctx    = auditStorage.getStore();
  const auteur = ctx ? (ctx.login ?? ctx.compteId) : null;
  const now    = new Date();

  // ── Injection automatique des champs d'audit ─────────────────────────────
  const action = params.action;

  if (action === 'create') {
    const d = params.args.data as Record<string, unknown> | undefined;
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      if (!d.creeLe)     d.creeLe     = now;
      if (!d.creePar && auteur) d.creePar = auteur;
    }
  }

  if (action === 'upsert') {
    const create = (params.args as any).create as Record<string, unknown> | undefined;
    const update = (params.args as any).update as Record<string, unknown> | undefined;
    if (create && typeof create === 'object') {
      if (!create.creeLe) create.creeLe = now;
      if (!create.creePar && auteur) create.creePar = auteur;
    }
    if (update && typeof update === 'object') {
      update.modifieLe  = now;
      if (auteur) update.modifiePar = auteur;
    }
  }

  if (action === 'update') {
    const d = params.args.data as Record<string, unknown> | undefined;
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      d.modifieLe = now;
      if (auteur) d.modifiePar = auteur;
    }
  }

  // ── Capture de l'état avant mutation (update / delete) ───────────────────
  let avant: Record<string, unknown> | null = null;
  const whereId = (params.args as any)?.where?.id as string | undefined;

  if ((action === 'update' || action === 'delete' || action === 'upsert') && whereId) {
    const modelKey = params.model.charAt(0).toLowerCase() + params.model.slice(1) as keyof PrismaClient;
    try {
      avant = await (prisma[modelKey] as any).findUnique({ where: { id: whereId } });
    } catch {
      // ignore — l'avant restera null
    }
  }

  // ── Exécution de l'opération ─────────────────────────────────────────────
  const result = await next(params);

  // ── Historisation ─────────────────────────────────────────────────────────
  if (['create', 'update', 'delete', 'upsert'].includes(action)) {
    const enregistrementId =
      (result as any)?.id ??
      whereId ??
      'unknown';

    try {
      await prisma.historiqueModification.create({
        data: {
          table:            params.model,
          enregistrementId: String(enregistrementId),
          action:           action.toUpperCase(),
          avant:            avant  ? JSON.stringify(avant)  : null,
          apres:            result ? JSON.stringify(result) : null,
          compteId:         ctx?.compteId ?? null,
          login:            ctx?.login    ?? null,
          dateCree:         now,
        },
      });
    } catch {
      // Ne jamais laisser l'historisation bloquer l'opération principale
    }
  }

  return result;
});
