/*
  Warnings:

  - You are about to drop the column `motifDesassignation` on the `taches` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_projets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'En démarrage',
    "chefProjetId" TEXT NOT NULL,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateDebutPrevisionnelle" DATETIME,
    "dateFinPrevisionnelle" DATETIME,
    "dateDebutEffective" DATETIME,
    "dateFinEffective" DATETIME,
    CONSTRAINT "projets_chefProjetId_fkey" FOREIGN KEY ("chefProjetId") REFERENCES "personnes_ressources" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_projets" ("chefProjetId", "dateCreation", "dateDebutEffective", "dateDebutPrevisionnelle", "dateFinEffective", "dateFinPrevisionnelle", "description", "id", "libelle", "statut") SELECT "chefProjetId", "dateCreation", "dateDebutEffective", "dateDebutPrevisionnelle", "dateFinEffective", "dateFinPrevisionnelle", "description", "id", "libelle", "statut" FROM "projets";
DROP TABLE "projets";
ALTER TABLE "new_projets" RENAME TO "projets";
CREATE UNIQUE INDEX "projets_libelle_key" ON "projets"("libelle");
CREATE TABLE "new_taches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projetId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "priorite" TEXT NOT NULL DEFAULT 'Critique',
    "assigneAId" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'À planifier',
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateDebutPrevisionnelle" DATETIME,
    "dateDebutEffective" DATETIME,
    "dateFinPrevisionnelle" DATETIME,
    "dateFinEffective" DATETIME,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "taches_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "taches_assigneAId_fkey" FOREIGN KEY ("assigneAId") REFERENCES "personnes_ressources" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_taches" ("assigneAId", "dateCreation", "dateDebutEffective", "dateDebutPrevisionnelle", "dateFinEffective", "dateFinPrevisionnelle", "description", "id", "libelle", "ordre", "priorite", "projetId", "statut") SELECT "assigneAId", "dateCreation", "dateDebutEffective", "dateDebutPrevisionnelle", "dateFinEffective", "dateFinPrevisionnelle", "description", "id", "libelle", "ordre", "priorite", "projetId", "statut" FROM "taches";
DROP TABLE "taches";
ALTER TABLE "new_taches" RENAME TO "taches";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
