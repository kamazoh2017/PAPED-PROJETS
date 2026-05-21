-- CreateTable
CREATE TABLE "programmes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "libelle" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "bailleur" TEXT,
    "dateDebut" DATETIME,
    "dateFin" DATETIME,
    "budgetTotal" REAL,
    "devise" TEXT NOT NULL DEFAULT 'XOF',
    "statut" TEXT NOT NULL DEFAULT 'Actif',
    "entiteId" TEXT,
    "creePar" TEXT,
    "creeLe" DATETIME,
    "modifiePar" TEXT,
    "modifieLe" DATETIME,
    CONSTRAINT "programmes_entiteId_fkey" FOREIGN KEY ("entiteId") REFERENCES "entites" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "resultats_attendus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projetId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "creePar" TEXT,
    "creeLe" DATETIME,
    "modifiePar" TEXT,
    "modifieLe" DATETIME,
    CONSTRAINT "resultats_attendus_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resultatId" TEXT NOT NULL,
    "parentActiviteId" TEXT,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "responsableId" TEXT,
    "dateDebutPrev" DATETIME,
    "dateFinPrev" DATETIME,
    "dateDebutEff" DATETIME,
    "dateFinEff" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'Planifiée',
    "progression" INTEGER NOT NULL DEFAULT 0,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "creePar" TEXT,
    "creeLe" DATETIME,
    "modifiePar" TEXT,
    "modifieLe" DATETIME,
    CONSTRAINT "activites_resultatId_fkey" FOREIGN KEY ("resultatId") REFERENCES "resultats_attendus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "activites_parentActiviteId_fkey" FOREIGN KEY ("parentActiviteId") REFERENCES "activites" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "activites_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "personnes_ressources" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_projets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'En démarrage',
    "etatAvancement" TEXT NOT NULL DEFAULT 'a-lheure',
    "chefProjetId" TEXT NOT NULL,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateDebutPrevisionnelle" DATETIME,
    "dateFinPrevisionnelle" DATETIME,
    "dateDebutEffective" DATETIME,
    "dateFinEffective" DATETIME,
    "tauxAvancementReel" REAL NOT NULL DEFAULT 0,
    "tauxAvancementAttendu" REAL NOT NULL DEFAULT 0,
    "tauxAchevementReel" REAL NOT NULL DEFAULT 0,
    "tauxAchevementAttendu" REAL NOT NULL DEFAULT 0,
    "entiteId" TEXT,
    "programmeId" TEXT,
    "creePar" TEXT,
    "creeLe" DATETIME,
    "modifiePar" TEXT,
    "modifieLe" DATETIME,
    CONSTRAINT "projets_entiteId_fkey" FOREIGN KEY ("entiteId") REFERENCES "entites" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "projets_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "programmes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "projets_chefProjetId_fkey" FOREIGN KEY ("chefProjetId") REFERENCES "personnes_ressources" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_projets" ("chefProjetId", "creeLe", "creePar", "dateCreation", "dateDebutEffective", "dateDebutPrevisionnelle", "dateFinEffective", "dateFinPrevisionnelle", "description", "entiteId", "etatAvancement", "id", "libelle", "modifieLe", "modifiePar", "programmeId", "statut", "tauxAchevementAttendu", "tauxAchevementReel", "tauxAvancementAttendu", "tauxAvancementReel") SELECT "chefProjetId", "creeLe", "creePar", "dateCreation", "dateDebutEffective", "dateDebutPrevisionnelle", "dateFinEffective", "dateFinPrevisionnelle", "description", "entiteId", "etatAvancement", "id", "libelle", "modifieLe", "modifiePar", "programmeId", "statut", "tauxAchevementAttendu", "tauxAchevementReel", "tauxAvancementAttendu", "tauxAvancementReel" FROM "projets";
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
    "etatAvancement" TEXT NOT NULL DEFAULT 'a-lheure',
    "progression" INTEGER NOT NULL DEFAULT 0,
    "poidsPriorite" INTEGER NOT NULL DEFAULT 1,
    "motifDesassignation" TEXT,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateDebutPrevisionnelle" DATETIME,
    "dateDebutEffective" DATETIME,
    "dateFinPrevisionnelle" DATETIME,
    "dateFinEffective" DATETIME,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "activiteId" TEXT,
    "creePar" TEXT,
    "creeLe" DATETIME,
    "modifiePar" TEXT,
    "modifieLe" DATETIME,
    CONSTRAINT "taches_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "taches_activiteId_fkey" FOREIGN KEY ("activiteId") REFERENCES "activites" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "taches_assigneAId_fkey" FOREIGN KEY ("assigneAId") REFERENCES "personnes_ressources" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_taches" ("activiteId", "assigneAId", "creeLe", "creePar", "dateCreation", "dateDebutEffective", "dateDebutPrevisionnelle", "dateFinEffective", "dateFinPrevisionnelle", "description", "etatAvancement", "id", "libelle", "modifieLe", "modifiePar", "motifDesassignation", "ordre", "poidsPriorite", "priorite", "progression", "projetId", "statut") SELECT "activiteId", "assigneAId", "creeLe", "creePar", "dateCreation", "dateDebutEffective", "dateDebutPrevisionnelle", "dateFinEffective", "dateFinPrevisionnelle", "description", "etatAvancement", "id", "libelle", "modifieLe", "modifiePar", "motifDesassignation", "ordre", "poidsPriorite", "priorite", "progression", "projetId", "statut" FROM "taches";
DROP TABLE "taches";
ALTER TABLE "new_taches" RENAME TO "taches";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "programmes_libelle_key" ON "programmes"("libelle");

-- CreateIndex
CREATE UNIQUE INDEX "programmes_code_key" ON "programmes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "resultats_attendus_projetId_code_key" ON "resultats_attendus"("projetId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "activites_resultatId_code_key" ON "activites"("resultatId", "code");

-- RedefineIndex (skipped: SQLite ne permet pas DROP des indexes auto-générés par UNIQUE)
-- L'index unique sur acteurs_collectifs.libelle existe déjà via la contrainte UNIQUE de la table.

