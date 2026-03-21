-- Migration additive : risques projet + dates effectives projet + nettoyage statuts

-- 1. Ajout des dates effectives sur les projets (colonnes nullables = sans impact sur données existantes)
ALTER TABLE "projets" ADD COLUMN "dateDebutEffective" DATETIME;
ALTER TABLE "projets" ADD COLUMN "dateFinEffective" DATETIME;

-- 2. Création de la table risques_projets
CREATE TABLE "risques_projets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projetId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "taux" REAL NOT NULL DEFAULT 0,
    "gravite" TEXT NOT NULL DEFAULT 'Faible',
    "couleur" TEXT NOT NULL DEFAULT 'Vert',
    CONSTRAINT "risques_projets_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. Migration des statuts projets : 'Demarrage' → 'En démarrage'
UPDATE "projets" SET "statut" = 'En démarrage' WHERE "statut" = 'Demarrage';

-- 4. Migration des statuts tâches : suppression de 'Backlog' et 'A valider'
UPDATE "taches" SET "statut" = 'À planifier' WHERE "statut" = 'Backlog';
UPDATE "taches" SET "statut" = 'Terminé' WHERE "statut" = 'A valider';
