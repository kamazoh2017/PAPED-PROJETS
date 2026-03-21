-- =====================================================================
-- Champs d'audit sur toutes les tables (additive — aucune donnée perdue)
-- =====================================================================

ALTER TABLE "projets"                  ADD COLUMN "creePar"    TEXT;
ALTER TABLE "projets"                  ADD COLUMN "creeLe"     DATETIME;
ALTER TABLE "projets"                  ADD COLUMN "modifiePar" TEXT;
ALTER TABLE "projets"                  ADD COLUMN "modifieLe"  DATETIME;

ALTER TABLE "entites"                  ADD COLUMN "creePar"    TEXT;
ALTER TABLE "entites"                  ADD COLUMN "creeLe"     DATETIME;
ALTER TABLE "entites"                  ADD COLUMN "modifiePar" TEXT;
ALTER TABLE "entites"                  ADD COLUMN "modifieLe"  DATETIME;

ALTER TABLE "personnes_ressources"     ADD COLUMN "creePar"    TEXT;
ALTER TABLE "personnes_ressources"     ADD COLUMN "creeLe"     DATETIME;
ALTER TABLE "personnes_ressources"     ADD COLUMN "modifiePar" TEXT;
ALTER TABLE "personnes_ressources"     ADD COLUMN "modifieLe"  DATETIME;

ALTER TABLE "comptes_acces"            ADD COLUMN "creePar"    TEXT;
ALTER TABLE "comptes_acces"            ADD COLUMN "creeLe"     DATETIME;
ALTER TABLE "comptes_acces"            ADD COLUMN "modifiePar" TEXT;
ALTER TABLE "comptes_acces"            ADD COLUMN "modifieLe"  DATETIME;

ALTER TABLE "permissions_page_action"  ADD COLUMN "creePar"    TEXT;
ALTER TABLE "permissions_page_action"  ADD COLUMN "creeLe"     DATETIME;
ALTER TABLE "permissions_page_action"  ADD COLUMN "modifiePar" TEXT;
ALTER TABLE "permissions_page_action"  ADD COLUMN "modifieLe"  DATETIME;

ALTER TABLE "sessions_auth"            ADD COLUMN "creePar"    TEXT;
ALTER TABLE "sessions_auth"            ADD COLUMN "creeLe"     DATETIME;
ALTER TABLE "sessions_auth"            ADD COLUMN "modifiePar" TEXT;
ALTER TABLE "sessions_auth"            ADD COLUMN "modifieLe"  DATETIME;

ALTER TABLE "parties_prenantes"        ADD COLUMN "creePar"    TEXT;
ALTER TABLE "parties_prenantes"        ADD COLUMN "creeLe"     DATETIME;
ALTER TABLE "parties_prenantes"        ADD COLUMN "modifiePar" TEXT;
ALTER TABLE "parties_prenantes"        ADD COLUMN "modifieLe"  DATETIME;

ALTER TABLE "parties_prenantes_projets" ADD COLUMN "creePar"    TEXT;
ALTER TABLE "parties_prenantes_projets" ADD COLUMN "creeLe"     DATETIME;
ALTER TABLE "parties_prenantes_projets" ADD COLUMN "modifiePar" TEXT;
ALTER TABLE "parties_prenantes_projets" ADD COLUMN "modifieLe"  DATETIME;

ALTER TABLE "taches"                   ADD COLUMN "creePar"    TEXT;
ALTER TABLE "taches"                   ADD COLUMN "creeLe"     DATETIME;
ALTER TABLE "taches"                   ADD COLUMN "modifiePar" TEXT;
ALTER TABLE "taches"                   ADD COLUMN "modifieLe"  DATETIME;

ALTER TABLE "commentaires_taches"      ADD COLUMN "creePar"    TEXT;
ALTER TABLE "commentaires_taches"      ADD COLUMN "creeLe"     DATETIME;
ALTER TABLE "commentaires_taches"      ADD COLUMN "modifiePar" TEXT;
ALTER TABLE "commentaires_taches"      ADD COLUMN "modifieLe"  DATETIME;

ALTER TABLE "risques_projets"          ADD COLUMN "creePar"    TEXT;
ALTER TABLE "risques_projets"          ADD COLUMN "creeLe"     DATETIME;
ALTER TABLE "risques_projets"          ADD COLUMN "modifiePar" TEXT;
ALTER TABLE "risques_projets"          ADD COLUMN "modifieLe"  DATETIME;

ALTER TABLE "activites_taches"         ADD COLUMN "creePar"    TEXT;
ALTER TABLE "activites_taches"         ADD COLUMN "creeLe"     DATETIME;
ALTER TABLE "activites_taches"         ADD COLUMN "modifiePar" TEXT;
ALTER TABLE "activites_taches"         ADD COLUMN "modifieLe"  DATETIME;

ALTER TABLE "taches_periodiques"       ADD COLUMN "creePar"    TEXT;
ALTER TABLE "taches_periodiques"       ADD COLUMN "creeLe"     DATETIME;
ALTER TABLE "taches_periodiques"       ADD COLUMN "modifiePar" TEXT;
ALTER TABLE "taches_periodiques"       ADD COLUMN "modifieLe"  DATETIME;

-- =====================================================================
-- Table d'historisation
-- =====================================================================

CREATE TABLE "historique_modifications" (
    "id"               TEXT     NOT NULL PRIMARY KEY,
    "table"            TEXT     NOT NULL,
    "enregistrementId" TEXT     NOT NULL,
    "action"           TEXT     NOT NULL,
    "avant"            TEXT,
    "apres"            TEXT,
    "compteId"         TEXT,
    "login"            TEXT,
    "dateCree"         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "historique_modifications_table_enregistrementId_idx"
    ON "historique_modifications"("table", "enregistrementId");

CREATE INDEX "historique_modifications_dateCree_idx"
    ON "historique_modifications"("dateCree");
