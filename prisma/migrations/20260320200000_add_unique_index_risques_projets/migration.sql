-- Recréation de la table risques_projets pour persister les indicateurs de risque calculés.
-- Contrainte unique (projetId, libelle) pour permettre l'upsert par indicateur.

CREATE TABLE "risques_projets" (
    "id"       TEXT NOT NULL PRIMARY KEY,
    "projetId" TEXT NOT NULL,
    "libelle"  TEXT NOT NULL,
    "taux"     REAL NOT NULL DEFAULT 0,
    "gravite"  TEXT NOT NULL DEFAULT 'Faible',
    "couleur"  TEXT NOT NULL DEFAULT 'Vert',
    CONSTRAINT "risques_projets_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "risques_projets_projetId_libelle_key" ON "risques_projets"("projetId", "libelle");
