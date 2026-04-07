-- =====================================================================
-- Ajout Projet.entiteId : entité porteuse / owner du projet (optionnel)
-- Distinct des parties prenantes (PartiePrenante) qui sont les entités impliquées
-- =====================================================================

ALTER TABLE "projets" ADD COLUMN "entiteId" TEXT REFERENCES "entites"("id") ON DELETE SET NULL;
