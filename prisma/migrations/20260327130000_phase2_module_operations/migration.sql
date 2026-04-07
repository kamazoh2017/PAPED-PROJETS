-- Phase 2 : Module Opérations
-- Création des tables : operations, taches_operationnelles, occurrences_taches, commentaires_occurrences

CREATE TABLE "operations" (
  "id"             TEXT NOT NULL PRIMARY KEY,
  "libelle"        TEXT NOT NULL,
  "description"    TEXT,
  "statut"         TEXT NOT NULL DEFAULT 'Active',
  "entite_id"      TEXT REFERENCES "entites"("id") ON DELETE SET NULL,
  "responsable_id" TEXT REFERENCES "personnes_ressources"("id") ON DELETE SET NULL,
  "projet_source_id" TEXT REFERENCES "projets"("id") ON DELETE SET NULL,
  "date_debut"     DATETIME NOT NULL,
  "date_fin"       DATETIME,
  "cree_par"       TEXT,
  "cree_le"        DATETIME,
  "modifie_par"    TEXT,
  "modifie_le"     DATETIME
);

CREATE TABLE "taches_operationnelles" (
  "id"                  TEXT NOT NULL PRIMARY KEY,
  "operation_id"        TEXT NOT NULL REFERENCES "operations"("id") ON DELETE CASCADE,
  "libelle"             TEXT NOT NULL,
  "description"         TEXT,
  "periodicite"         TEXT NOT NULL,
  "config_periodicite"  TEXT,
  "delai_execution"     INTEGER NOT NULL DEFAULT 3,
  "priorite"            TEXT NOT NULL DEFAULT 'Normale',
  "responsable_id"      TEXT REFERENCES "personnes_ressources"("id") ON DELETE SET NULL,
  "entite_id"           TEXT REFERENCES "entites"("id") ON DELETE SET NULL,
  "est_actif"           BOOLEAN NOT NULL DEFAULT 1,
  "date_debut"          DATETIME NOT NULL,
  "date_fin"            DATETIME,
  "cree_par"            TEXT,
  "cree_le"             DATETIME,
  "modifie_par"         TEXT,
  "modifie_le"          DATETIME
);

CREATE TABLE "occurrences_taches" (
  "id"                       TEXT NOT NULL PRIMARY KEY,
  "tache_operationnelle_id"  TEXT NOT NULL REFERENCES "taches_operationnelles"("id") ON DELETE CASCADE,
  "date_prevue"              DATETIME NOT NULL,
  "date_echeance"            DATETIME NOT NULL,
  "date_realisation"         DATETIME,
  "statut"                   TEXT NOT NULL DEFAULT 'En attente',
  "realise_par_id"           TEXT REFERENCES "personnes_ressources"("id") ON DELETE SET NULL,
  "commentaire"              TEXT,
  "retard_jours"             INTEGER,
  "cree_par"                 TEXT,
  "cree_le"                  DATETIME,
  "modifie_par"              TEXT,
  "modifie_le"               DATETIME
);

CREATE TABLE "commentaires_occurrences" (
  "id"             TEXT NOT NULL PRIMARY KEY,
  "occurrence_id"  TEXT NOT NULL REFERENCES "occurrences_taches"("id") ON DELETE CASCADE,
  "compte_acces_id" TEXT NOT NULL REFERENCES "comptes_acces"("id") ON DELETE CASCADE,
  "contenu"        TEXT NOT NULL,
  "date_creation"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "parent_id"      TEXT REFERENCES "commentaires_occurrences"("id") ON DELETE SET NULL,
  "cree_par"       TEXT,
  "cree_le"        DATETIME,
  "modifie_par"    TEXT,
  "modifie_le"     DATETIME
);
