-- Phase 3 : Permissions pour le module Opérations et Occurrences
-- Insère les permissions pour tous les comptes non-superAdmin (INSERT OR IGNORE = idempotent)

INSERT OR IGNORE INTO "permissions_page_action" ("id", "compteId", "pageKey", "actionKey", "autorise", "dateMaj")
SELECT
  lower(hex(randomblob(16))),
  c."id",
  p."pageKey",
  p."actionKey",
  p."autorise",
  CURRENT_TIMESTAMP
FROM "comptes_acces" c
CROSS JOIN (
  SELECT 'operations'  AS "pageKey", 'view'   AS "actionKey", 1 AS "autorise" UNION ALL
  SELECT 'operations',                'create',                 1              UNION ALL
  SELECT 'operations',                'update',                 1              UNION ALL
  SELECT 'operations',                'delete',                 1              UNION ALL
  SELECT 'occurrences',               'view',                   1              UNION ALL
  SELECT 'occurrences',               'update',                 1
) p
WHERE c."estSuperAdmin" = 0;
