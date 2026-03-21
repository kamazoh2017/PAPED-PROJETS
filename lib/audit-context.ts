/**
 * Contexte d'audit propagé via AsyncLocalStorage.
 * Défini dans requireAuth, lu par le middleware Prisma.
 */
import { AsyncLocalStorage } from 'async_hooks';

export interface AuditCtx {
  compteId: string;
  login?: string;
}

export const auditStorage = new AsyncLocalStorage<AuditCtx>();
