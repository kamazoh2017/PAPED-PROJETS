-- Migration: add_logframe
-- Ajout du module Cadre Logique : Programme + ResultatAttendu + Activite
-- + colonnes FK optionnelles sur projets.programmeId et taches.activiteId
-- Voir docs/MIGRATION_CADRE_LOGIQUE.md

-- ─────────────────────────────────────────────
-- 1. CreateTable: programmes
-- ─────────────────────────────────────────────
CREATE TABLE `programmes` (
    `id` VARCHAR(191) NOT NULL,
    `libelle` VARCHAR(255) NOT NULL,
    `code` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `bailleur` VARCHAR(255) NULL,
    `dateDebut` DATETIME(3) NULL,
    `dateFin` DATETIME(3) NULL,
    `budgetTotal` DOUBLE NULL,
    `devise` VARCHAR(10) NOT NULL DEFAULT 'XOF',
    `statut` VARCHAR(50) NOT NULL DEFAULT 'Actif',
    `entiteId` VARCHAR(191) NULL,
    `creePar` VARCHAR(255) NULL,
    `creeLe` DATETIME(3) NULL,
    `modifiePar` VARCHAR(255) NULL,
    `modifieLe` DATETIME(3) NULL,

    UNIQUE INDEX `programmes_libelle_key`(`libelle`),
    UNIQUE INDEX `programmes_code_key`(`code`),
    INDEX `programmes_entiteId_idx`(`entiteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 2. CreateTable: resultats_attendus
-- ─────────────────────────────────────────────
CREATE TABLE `resultats_attendus` (
    `id` VARCHAR(191) NOT NULL,
    `projetId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `creePar` VARCHAR(255) NULL,
    `creeLe` DATETIME(3) NULL,
    `modifiePar` VARCHAR(255) NULL,
    `modifieLe` DATETIME(3) NULL,

    UNIQUE INDEX `resultats_attendus_projetId_code_key`(`projetId`, `code`),
    INDEX `resultats_attendus_projetId_idx`(`projetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 3. CreateTable: activites
-- ─────────────────────────────────────────────
CREATE TABLE `activites` (
    `id` VARCHAR(191) NOT NULL,
    `resultatId` VARCHAR(191) NOT NULL,
    `parentActiviteId` VARCHAR(191) NULL,
    `code` VARCHAR(50) NOT NULL,
    `libelle` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `responsableId` VARCHAR(191) NULL,
    `dateDebutPrev` DATETIME(3) NULL,
    `dateFinPrev` DATETIME(3) NULL,
    `dateDebutEff` DATETIME(3) NULL,
    `dateFinEff` DATETIME(3) NULL,
    `statut` VARCHAR(50) NOT NULL DEFAULT 'Planifiée',
    `progression` INTEGER NOT NULL DEFAULT 0,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `creePar` VARCHAR(255) NULL,
    `creeLe` DATETIME(3) NULL,
    `modifiePar` VARCHAR(255) NULL,
    `modifieLe` DATETIME(3) NULL,

    UNIQUE INDEX `activites_resultatId_code_key`(`resultatId`, `code`),
    INDEX `activites_resultatId_idx`(`resultatId`),
    INDEX `activites_parentActiviteId_idx`(`parentActiviteId`),
    INDEX `activites_responsableId_idx`(`responsableId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- 4. AlterTable: projets - ajout programmeId (NULL, donc safe pour lignes existantes)
-- ─────────────────────────────────────────────
ALTER TABLE `projets` ADD COLUMN `programmeId` VARCHAR(191) NULL;
CREATE INDEX `projets_programmeId_idx` ON `projets`(`programmeId`);

-- ─────────────────────────────────────────────
-- 5. AlterTable: taches - ajout activiteId (NULL, donc safe pour lignes existantes)
-- ─────────────────────────────────────────────
ALTER TABLE `taches` ADD COLUMN `activiteId` VARCHAR(191) NULL;
CREATE INDEX `taches_activiteId_idx` ON `taches`(`activiteId`);

-- ─────────────────────────────────────────────
-- 6. Foreign Keys
-- ─────────────────────────────────────────────
ALTER TABLE `programmes` ADD CONSTRAINT `programmes_entiteId_fkey`
    FOREIGN KEY (`entiteId`) REFERENCES `entites`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `resultats_attendus` ADD CONSTRAINT `resultats_attendus_projetId_fkey`
    FOREIGN KEY (`projetId`) REFERENCES `projets`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `activites` ADD CONSTRAINT `activites_resultatId_fkey`
    FOREIGN KEY (`resultatId`) REFERENCES `resultats_attendus`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `activites` ADD CONSTRAINT `activites_parentActiviteId_fkey`
    FOREIGN KEY (`parentActiviteId`) REFERENCES `activites`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `activites` ADD CONSTRAINT `activites_responsableId_fkey`
    FOREIGN KEY (`responsableId`) REFERENCES `personnes_ressources`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `projets` ADD CONSTRAINT `projets_programmeId_fkey`
    FOREIGN KEY (`programmeId`) REFERENCES `programmes`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `taches` ADD CONSTRAINT `taches_activiteId_fkey`
    FOREIGN KEY (`activiteId`) REFERENCES `activites`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
