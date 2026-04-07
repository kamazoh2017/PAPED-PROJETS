-- =====================================================================
-- Phase 1 : Hiérarchie des entités + rattachement Projet → Entite
-- Évolution additive : aucune colonne existante supprimée ou modifiée
-- =====================================================================

-- Ajout du type d'entité (label libre : Direction, Service, Section…)
ALTER TABLE "entites" ADD COLUMN "typeEntite" TEXT;

-- Ajout de la référence parent pour l'arbre hiérarchique (auto-référence)
ALTER TABLE "entites" ADD COLUMN "parentId" TEXT REFERENCES "entites"("id") ON DELETE SET NULL;

-- Rattachement optionnel d'un projet à une entité
ALTER TABLE "projets" ADD COLUMN "entiteId" TEXT REFERENCES "entites"("id") ON DELETE SET NULL;
