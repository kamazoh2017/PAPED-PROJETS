-- AlterTable: add audit columns to sous_taches
ALTER TABLE "sous_taches" ADD COLUMN "creePar" TEXT;
ALTER TABLE "sous_taches" ADD COLUMN "creeLe" DATETIME;
ALTER TABLE "sous_taches" ADD COLUMN "modifiePar" TEXT;
ALTER TABLE "sous_taches" ADD COLUMN "modifieLe" DATETIME;
