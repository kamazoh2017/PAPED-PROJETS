-- Ajout du champ etat_avancement sur projets et taches
-- Additive : aucune donnée existante affectée

ALTER TABLE "projets" ADD COLUMN "etatAvancement" TEXT NOT NULL DEFAULT 'a-lheure';
ALTER TABLE "taches"  ADD COLUMN "etatAvancement" TEXT NOT NULL DEFAULT 'a-lheure';
