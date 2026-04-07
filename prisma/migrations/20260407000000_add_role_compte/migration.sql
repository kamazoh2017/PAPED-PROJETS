-- Ajout du champ role sur CompteAcces
-- Valeurs: AGENT | GESTIONNAIRE | COORDINATEUR | ADMINISTRATEUR
-- Tous les comptes existants démarrent en AGENT (le plus restrictif)

ALTER TABLE "comptes_acces" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'AGENT';
