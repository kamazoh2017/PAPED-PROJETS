-- =====================================================================
-- Refactorisation des parties prenantes
-- Suppression : parties_prenantes (ancienne) + parties_prenantes_projets
-- Création    : acteurs_collectifs + parties_prenantes (nouveau modèle)
-- =====================================================================

PRAGMA foreign_keys = OFF;

-- 1. Supprimer les anciennes tables
DROP TABLE IF EXISTS "parties_prenantes_projets";
DROP TABLE IF EXISTS "parties_prenantes";

-- 2. Créer la table des acteurs collectifs non organisationnels
CREATE TABLE "acteurs_collectifs" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "libelle"     TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "creePar"     TEXT,
  "creeLe"      DATETIME,
  "modifiePar"  TEXT,
  "modifieLe"   DATETIME
);

-- 3. Créer la nouvelle table parties prenantes (lien direct au projet)
CREATE TABLE "parties_prenantes" (
  "id"                     TEXT NOT NULL PRIMARY KEY,
  "projetId"               TEXT NOT NULL,
  "typeActeur"             TEXT NOT NULL,  -- ORGANISATIONNEL | ACTEUR_COLLECTIF_NON_ORGANISATIONNEL
  "ressourceId"            TEXT,           -- requis si ORGANISATIONNEL
  "acteurCollectifId"      TEXT,           -- requis si ACTEUR_COLLECTIF_NON_ORGANISATIONNEL
  "role"                   TEXT NOT NULL,
  "influence"              TEXT NOT NULL DEFAULT 'Moyen',
  "interet"                TEXT NOT NULL DEFAULT 'Moyen',
  "attentesTexte"          TEXT,
  "strategieCommunication" TEXT,
  "notes"                  TEXT,
  "creePar"                TEXT,
  "creeLe"                 DATETIME,
  "modifiePar"             TEXT,
  "modifieLe"              DATETIME,
  CONSTRAINT "pp_projet_fk"   FOREIGN KEY ("projetId")          REFERENCES "projets"("id")             ON DELETE CASCADE,
  CONSTRAINT "pp_ressource_fk" FOREIGN KEY ("ressourceId")      REFERENCES "personnes_ressources"("id") ON DELETE SET NULL,
  CONSTRAINT "pp_acteur_fk"   FOREIGN KEY ("acteurCollectifId") REFERENCES "acteurs_collectifs"("id")   ON DELETE SET NULL
);

PRAGMA foreign_keys = ON;
