-- =====================================================================
-- Correction modèle : suppression de Projet.entiteId
-- Le lien Projet ↔ Entite passe par PartiePrenante, pas par une FK directe
-- SQLite ne supporte pas DROP COLUMN nativement avant 3.35 — on recrée la table
-- =====================================================================

PRAGMA foreign_keys = OFF;

CREATE TABLE "projets_new" (
  "id"                      TEXT NOT NULL PRIMARY KEY,
  "libelle"                 TEXT NOT NULL,
  "description"             TEXT,
  "statut"                  TEXT NOT NULL DEFAULT 'En démarrage',
  "etatAvancement"          TEXT NOT NULL DEFAULT 'a-lheure',
  "chefProjetId"            TEXT NOT NULL,
  "dateCreation"            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dateDebutPrevisionnelle" DATETIME,
  "dateFinPrevisionnelle"   DATETIME,
  "dateDebutEffective"      DATETIME,
  "dateFinEffective"        DATETIME,
  "tauxAvancementReel"      REAL NOT NULL DEFAULT 0,
  "tauxAvancementAttendu"   REAL NOT NULL DEFAULT 0,
  "tauxAchevementReel"      REAL NOT NULL DEFAULT 0,
  "tauxAchevementAttendu"   REAL NOT NULL DEFAULT 0,
  "creePar"                 TEXT,
  "creeLe"                  DATETIME,
  "modifiePar"              TEXT,
  "modifieLe"               DATETIME,
  CONSTRAINT "projets_chefProjetId_fkey" FOREIGN KEY ("chefProjetId") REFERENCES "personnes_ressources" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "projets_new"
  SELECT
    "id", "libelle", "description", "statut", "etatAvancement", "chefProjetId",
    "dateCreation", "dateDebutPrevisionnelle", "dateFinPrevisionnelle",
    "dateDebutEffective", "dateFinEffective",
    "tauxAvancementReel", "tauxAvancementAttendu",
    "tauxAchevementReel", "tauxAchevementAttendu",
    "creePar", "creeLe", "modifiePar", "modifieLe"
  FROM "projets";

DROP TABLE "projets";
ALTER TABLE "projets_new" RENAME TO "projets";

PRAGMA foreign_keys = ON;
