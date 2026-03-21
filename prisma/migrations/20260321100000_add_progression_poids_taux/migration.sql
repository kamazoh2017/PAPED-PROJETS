-- AlterTable taches : progression (déduit du statut) et poidsPriorite (déduit de la priorité)
ALTER TABLE "taches" ADD COLUMN "progression"    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "taches" ADD COLUMN "poidsPriorite"  INTEGER NOT NULL DEFAULT 1;

-- AlterTable projets : taux d'avancement et d'achèvement (réel et attendu)
ALTER TABLE "projets" ADD COLUMN "tauxAvancementReel"     REAL NOT NULL DEFAULT 0;
ALTER TABLE "projets" ADD COLUMN "tauxAvancementAttendu"  REAL NOT NULL DEFAULT 0;
ALTER TABLE "projets" ADD COLUMN "tauxAchevementReel"     REAL NOT NULL DEFAULT 0;
ALTER TABLE "projets" ADD COLUMN "tauxAchevementAttendu"  REAL NOT NULL DEFAULT 0;
