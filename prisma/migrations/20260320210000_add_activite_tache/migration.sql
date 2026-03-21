-- Historique d'activité des tâches : remplace les expérimentations motifStatut/tagStatut
-- Table additive, aucune donnée existante affectée

CREATE TABLE "activites_taches" (
    "id"           TEXT NOT NULL PRIMARY KEY,
    "tacheId"      TEXT NOT NULL,
    "projetId"     TEXT NOT NULL,
    "type"         TEXT NOT NULL,
    "detail"       TEXT NOT NULL DEFAULT '{}',
    "compteId"     TEXT,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activites_taches_tacheId_fkey"  FOREIGN KEY ("tacheId")  REFERENCES "taches" ("id")       ON DELETE CASCADE  ON UPDATE CASCADE,
    CONSTRAINT "activites_taches_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets" ("id")      ON DELETE CASCADE  ON UPDATE CASCADE,
    CONSTRAINT "activites_taches_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes_acces" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
