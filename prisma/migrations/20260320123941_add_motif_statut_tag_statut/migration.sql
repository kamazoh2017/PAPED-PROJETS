/*
  Warnings:

  - You are about to drop the column `statutExecution` on the `commentaires_taches` table. All the data in the column will be lost.
  - You are about to drop the column `motifDesassignation` on the `taches` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_commentaires_taches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tacheId" TEXT NOT NULL,
    "compteAccesId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "tagStatut" TEXT,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentId" TEXT,
    CONSTRAINT "commentaires_taches_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "taches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "commentaires_taches_compteAccesId_fkey" FOREIGN KEY ("compteAccesId") REFERENCES "comptes_acces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "commentaires_taches_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "commentaires_taches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_commentaires_taches" ("compteAccesId", "contenu", "dateCreation", "id", "parentId", "tacheId") SELECT "compteAccesId", "contenu", "dateCreation", "id", "parentId", "tacheId" FROM "commentaires_taches";
DROP TABLE "commentaires_taches";
ALTER TABLE "new_commentaires_taches" RENAME TO "commentaires_taches";
CREATE TABLE "new_taches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projetId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "priorite" TEXT NOT NULL DEFAULT 'Critique',
    "assigneAId" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'À planifier',
    "motifStatut" TEXT,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateDebutPrevisionnelle" DATETIME,
    "dateDebutEffective" DATETIME,
    "dateFinPrevisionnelle" DATETIME,
    "dateFinEffective" DATETIME,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "taches_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "taches_assigneAId_fkey" FOREIGN KEY ("assigneAId") REFERENCES "personnes_ressources" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_taches" ("assigneAId", "dateCreation", "dateDebutEffective", "dateDebutPrevisionnelle", "dateFinEffective", "dateFinPrevisionnelle", "description", "id", "libelle", "motifStatut", "ordre", "priorite", "projetId", "statut") SELECT "assigneAId", "dateCreation", "dateDebutEffective", "dateDebutPrevisionnelle", "dateFinEffective", "dateFinPrevisionnelle", "description", "id", "libelle", "motifStatut", "ordre", "priorite", "projetId", "statut" FROM "taches";
DROP TABLE "taches";
ALTER TABLE "new_taches" RENAME TO "taches";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
