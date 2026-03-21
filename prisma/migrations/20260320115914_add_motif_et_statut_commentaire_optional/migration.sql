/*
  Warnings:

  - You are about to drop the column `tag` on the `commentaires_taches` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "taches" ADD COLUMN "motifDesassignation" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_commentaires_taches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tacheId" TEXT NOT NULL,
    "compteAccesId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentId" TEXT,
    "statutExecution" TEXT,
    CONSTRAINT "commentaires_taches_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "taches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "commentaires_taches_compteAccesId_fkey" FOREIGN KEY ("compteAccesId") REFERENCES "comptes_acces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "commentaires_taches_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "commentaires_taches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_commentaires_taches" ("compteAccesId", "contenu", "dateCreation", "id", "parentId", "tacheId") SELECT "compteAccesId", "contenu", "dateCreation", "id", "parentId", "tacheId" FROM "commentaires_taches";
DROP TABLE "commentaires_taches";
ALTER TABLE "new_commentaires_taches" RENAME TO "commentaires_taches";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
