-- CreateTable
CREATE TABLE `projets` (
    `id` VARCHAR(191) NOT NULL,
    `libelle` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `statut` VARCHAR(50) NOT NULL DEFAULT 'En démarrage',
    `etatAvancement` VARCHAR(50) NOT NULL DEFAULT 'a-lheure',
    `chefProjetId` VARCHAR(191) NOT NULL,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateDebutPrevisionnelle` DATETIME(3) NULL,
    `dateFinPrevisionnelle` DATETIME(3) NULL,
    `dateDebutEffective` DATETIME(3) NULL,
    `dateFinEffective` DATETIME(3) NULL,
    `tauxAvancementReel` DOUBLE NOT NULL DEFAULT 0,
    `tauxAvancementAttendu` DOUBLE NOT NULL DEFAULT 0,
    `tauxAchevementReel` DOUBLE NOT NULL DEFAULT 0,
    `tauxAchevementAttendu` DOUBLE NOT NULL DEFAULT 0,
    `entiteId` VARCHAR(191) NULL,
    `creePar` VARCHAR(255) NULL,
    `creeLe` DATETIME(3) NULL,
    `modifiePar` VARCHAR(255) NULL,
    `modifieLe` DATETIME(3) NULL,

    UNIQUE INDEX `projets_libelle_key`(`libelle`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `entites` (
    `id` VARCHAR(191) NOT NULL,
    `libelle` VARCHAR(255) NOT NULL,
    `tutelle` VARCHAR(255) NULL,
    `typeEntite` VARCHAR(100) NULL,
    `parentId` VARCHAR(191) NULL,
    `creePar` VARCHAR(255) NULL,
    `creeLe` DATETIME(3) NULL,
    `modifiePar` VARCHAR(255) NULL,
    `modifieLe` DATETIME(3) NULL,

    UNIQUE INDEX `entites_libelle_key`(`libelle`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `personnes_ressources` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(255) NOT NULL,
    `prenoms` VARCHAR(255) NOT NULL,
    `telephone` VARCHAR(50) NULL,
    `email` VARCHAR(255) NOT NULL,
    `fonction` VARCHAR(255) NOT NULL,
    `entiteId` VARCHAR(191) NOT NULL,
    `estChefProjet` BOOLEAN NOT NULL DEFAULT false,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creePar` VARCHAR(255) NULL,
    `creeLe` DATETIME(3) NULL,
    `modifiePar` VARCHAR(255) NULL,
    `modifieLe` DATETIME(3) NULL,

    UNIQUE INDEX `personnes_ressources_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comptes_acces` (
    `id` VARCHAR(191) NOT NULL,
    `login` VARCHAR(255) NULL,
    `estSuperAdmin` BOOLEAN NOT NULL DEFAULT false,
    `role` VARCHAR(50) NOT NULL DEFAULT 'AGENT',
    `personneId` VARCHAR(191) NULL,
    `motDePasseHash` VARCHAR(255) NOT NULL,
    `estActif` BOOLEAN NOT NULL DEFAULT true,
    `doitChangerMdp` BOOLEAN NOT NULL DEFAULT true,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateDerniereConnex` DATETIME(3) NULL,
    `creePar` VARCHAR(255) NULL,
    `creeLe` DATETIME(3) NULL,
    `modifiePar` VARCHAR(255) NULL,
    `modifieLe` DATETIME(3) NULL,

    UNIQUE INDEX `comptes_acces_login_key`(`login`),
    UNIQUE INDEX `comptes_acces_personneId_key`(`personneId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions_page_action` (
    `id` VARCHAR(191) NOT NULL,
    `compteId` VARCHAR(191) NOT NULL,
    `pageKey` VARCHAR(100) NOT NULL,
    `actionKey` VARCHAR(100) NOT NULL,
    `autorise` BOOLEAN NOT NULL DEFAULT false,
    `dateMaj` DATETIME(3) NOT NULL,
    `creePar` VARCHAR(255) NULL,
    `creeLe` DATETIME(3) NULL,
    `modifiePar` VARCHAR(255) NULL,
    `modifieLe` DATETIME(3) NULL,

    UNIQUE INDEX `permissions_page_action_compteId_pageKey_actionKey_key`(`compteId`, `pageKey`, `actionKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions_auth` (
    `id` VARCHAR(191) NOT NULL,
    `compteId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(500) NOT NULL,
    `expireLe` DATETIME(3) NOT NULL,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creePar` VARCHAR(255) NULL,
    `creeLe` DATETIME(3) NULL,
    `modifiePar` VARCHAR(255) NULL,
    `modifieLe` DATETIME(3) NULL,

    UNIQUE INDEX `sessions_auth_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `acteurs_collectifs` (
    `id` VARCHAR(191) NOT NULL,
    `libelle` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `creePar` VARCHAR(255) NULL,
    `creeLe` DATETIME(3) NULL,
    `modifiePar` VARCHAR(255) NULL,
    `modifieLe` DATETIME(3) NULL,

    UNIQUE INDEX `acteurs_collectifs_libelle_key`(`libelle`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parties_prenantes` (
    `id` VARCHAR(191) NOT NULL,
    `projetId` VARCHAR(191) NOT NULL,
    `typeActeur` VARCHAR(100) NOT NULL,
    `ressourceId` VARCHAR(191) NULL,
    `acteurCollectifId` VARCHAR(191) NULL,
    `role` VARCHAR(255) NOT NULL,
    `influence` VARCHAR(50) NOT NULL DEFAULT 'Moyen',
    `interet` VARCHAR(50) NOT NULL DEFAULT 'Moyen',
    `attentesTexte` TEXT NULL,
    `strategieCommunication` TEXT NULL,
    `notes` TEXT NULL,
    `creePar` VARCHAR(255) NULL,
    `creeLe` DATETIME(3) NULL,
    `modifiePar` VARCHAR(255) NULL,
    `modifieLe` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `taches` (
    `id` VARCHAR(191) NOT NULL,
    `projetId` VARCHAR(191) NOT NULL,
    `libelle` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `priorite` VARCHAR(50) NOT NULL DEFAULT 'Critique',
    `assigneAId` VARCHAR(191) NULL,
    `statut` VARCHAR(50) NOT NULL DEFAULT 'À planifier',
    `etatAvancement` VARCHAR(50) NOT NULL DEFAULT 'a-lheure',
    `progression` INTEGER NOT NULL DEFAULT 0,
    `poidsPriorite` INTEGER NOT NULL DEFAULT 1,
    `motifDesassignation` TEXT NULL,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateDebutPrevisionnelle` DATETIME(3) NULL,
    `dateDebutEffective` DATETIME(3) NULL,
    `dateFinPrevisionnelle` DATETIME(3) NULL,
    `dateFinEffective` DATETIME(3) NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `creePar` VARCHAR(255) NULL,
    `creeLe` DATETIME(3) NULL,
    `modifiePar` VARCHAR(255) NULL,
    `modifieLe` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sous_taches` (
    `id` VARCHAR(191) NOT NULL,
    `tacheId` VARCHAR(191) NOT NULL,
    `libelle` VARCHAR(500) NOT NULL,
    `estFaite` BOOLEAN NOT NULL DEFAULT false,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creePar` VARCHAR(255) NULL,
    `creeLe` DATETIME(3) NULL,
    `modifiePar` VARCHAR(255) NULL,
    `modifieLe` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commentaires_taches` (
    `id` VARCHAR(191) NOT NULL,
    `tacheId` VARCHAR(191) NOT NULL,
    `compteAccesId` VARCHAR(191) NOT NULL,
    `contenu` TEXT NOT NULL,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `parentId` VARCHAR(191) NULL,
    `creePar` VARCHAR(255) NULL,
    `creeLe` DATETIME(3) NULL,
    `modifiePar` VARCHAR(255) NULL,
    `modifieLe` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `risques_projets` (
    `id` VARCHAR(191) NOT NULL,
    `projetId` VARCHAR(191) NOT NULL,
    `libelle` VARCHAR(500) NOT NULL,
    `taux` DOUBLE NOT NULL DEFAULT 0,
    `gravite` VARCHAR(50) NOT NULL DEFAULT 'Faible',
    `couleur` VARCHAR(50) NOT NULL DEFAULT 'Vert',
    `creePar` VARCHAR(255) NULL,
    `creeLe` DATETIME(3) NULL,
    `modifiePar` VARCHAR(255) NULL,
    `modifieLe` DATETIME(3) NULL,

    UNIQUE INDEX `risques_projets_projetId_libelle_key`(`projetId`, `libelle`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activites_taches` (
    `id` VARCHAR(191) NOT NULL,
    `tacheId` VARCHAR(191) NOT NULL,
    `projetId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `detail` VARCHAR(2000) NOT NULL DEFAULT '{}',
    `compteId` VARCHAR(191) NULL,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creePar` VARCHAR(255) NULL,
    `creeLe` DATETIME(3) NULL,
    `modifiePar` VARCHAR(255) NULL,
    `modifieLe` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `taches_periodiques` (
    `id` VARCHAR(191) NOT NULL,
    `libelle` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `periodicite` VARCHAR(50) NOT NULL,
    `dateDebut` DATETIME(3) NOT NULL,
    `dateFin` DATETIME(3) NULL,
    `responsableId` VARCHAR(191) NOT NULL,
    `entiteExecutionId` VARCHAR(191) NOT NULL,
    `statut` VARCHAR(50) NOT NULL DEFAULT 'A faire',
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creePar` VARCHAR(255) NULL,
    `creeLe` DATETIME(3) NULL,
    `modifiePar` VARCHAR(255) NULL,
    `modifieLe` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `operations` (
    `id` VARCHAR(191) NOT NULL,
    `libelle` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `statut` VARCHAR(50) NOT NULL DEFAULT 'Active',
    `entiteId` VARCHAR(191) NULL,
    `responsableId` VARCHAR(191) NULL,
    `projetSourceId` VARCHAR(191) NULL,
    `dateDebut` DATETIME(3) NOT NULL,
    `dateFin` DATETIME(3) NULL,
    `creePar` VARCHAR(255) NULL,
    `creeLe` DATETIME(3) NULL,
    `modifiePar` VARCHAR(255) NULL,
    `modifieLe` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `taches_operationnelles` (
    `id` VARCHAR(191) NOT NULL,
    `operationId` VARCHAR(191) NOT NULL,
    `libelle` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `periodicite` VARCHAR(50) NOT NULL,
    `configPeriodicite` TEXT NULL,
    `delaiExecution` INTEGER NOT NULL DEFAULT 3,
    `priorite` VARCHAR(50) NOT NULL DEFAULT 'Normale',
    `responsableId` VARCHAR(191) NULL,
    `entiteId` VARCHAR(191) NULL,
    `estActif` BOOLEAN NOT NULL DEFAULT true,
    `dateDebut` DATETIME(3) NOT NULL,
    `dateFin` DATETIME(3) NULL,
    `creePar` VARCHAR(255) NULL,
    `creeLe` DATETIME(3) NULL,
    `modifiePar` VARCHAR(255) NULL,
    `modifieLe` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `occurrences_taches` (
    `id` VARCHAR(191) NOT NULL,
    `tacheOperationnelleId` VARCHAR(191) NOT NULL,
    `datePrevue` DATETIME(3) NOT NULL,
    `dateEcheance` DATETIME(3) NOT NULL,
    `dateRealisation` DATETIME(3) NULL,
    `statut` VARCHAR(100) NOT NULL DEFAULT 'En attente',
    `realiseParId` VARCHAR(191) NULL,
    `commentaire` TEXT NULL,
    `retardJours` INTEGER NULL,
    `creePar` VARCHAR(255) NULL,
    `creeLe` DATETIME(3) NULL,
    `modifiePar` VARCHAR(255) NULL,
    `modifieLe` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commentaires_occurrences` (
    `id` VARCHAR(191) NOT NULL,
    `occurrenceId` VARCHAR(191) NOT NULL,
    `compteAccesId` VARCHAR(191) NOT NULL,
    `contenu` TEXT NOT NULL,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `parentId` VARCHAR(191) NULL,
    `creePar` VARCHAR(255) NULL,
    `creeLe` DATETIME(3) NULL,
    `modifiePar` VARCHAR(255) NULL,
    `modifieLe` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historique_modifications` (
    `id` VARCHAR(191) NOT NULL,
    `table` VARCHAR(100) NOT NULL,
    `enregistrementId` VARCHAR(100) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `avant` TEXT NULL,
    `apres` TEXT NULL,
    `compteId` VARCHAR(191) NULL,
    `login` VARCHAR(255) NULL,
    `dateCree` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `historique_modifications_table_enregistrementId_idx`(`table`, `enregistrementId`),
    INDEX `historique_modifications_dateCree_idx`(`dateCree`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_EquipeProjet` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_EquipeProjet_AB_unique`(`A`, `B`),
    INDEX `_EquipeProjet_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `projets` ADD CONSTRAINT `projets_entiteId_fkey` FOREIGN KEY (`entiteId`) REFERENCES `entites`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projets` ADD CONSTRAINT `projets_chefProjetId_fkey` FOREIGN KEY (`chefProjetId`) REFERENCES `personnes_ressources`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `entites` ADD CONSTRAINT `entites_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `entites`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `personnes_ressources` ADD CONSTRAINT `personnes_ressources_entiteId_fkey` FOREIGN KEY (`entiteId`) REFERENCES `entites`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comptes_acces` ADD CONSTRAINT `comptes_acces_personneId_fkey` FOREIGN KEY (`personneId`) REFERENCES `personnes_ressources`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissions_page_action` ADD CONSTRAINT `permissions_page_action_compteId_fkey` FOREIGN KEY (`compteId`) REFERENCES `comptes_acces`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions_auth` ADD CONSTRAINT `sessions_auth_compteId_fkey` FOREIGN KEY (`compteId`) REFERENCES `comptes_acces`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `parties_prenantes` ADD CONSTRAINT `parties_prenantes_projetId_fkey` FOREIGN KEY (`projetId`) REFERENCES `projets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `parties_prenantes` ADD CONSTRAINT `parties_prenantes_ressourceId_fkey` FOREIGN KEY (`ressourceId`) REFERENCES `personnes_ressources`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `parties_prenantes` ADD CONSTRAINT `parties_prenantes_acteurCollectifId_fkey` FOREIGN KEY (`acteurCollectifId`) REFERENCES `acteurs_collectifs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `taches` ADD CONSTRAINT `taches_projetId_fkey` FOREIGN KEY (`projetId`) REFERENCES `projets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `taches` ADD CONSTRAINT `taches_assigneAId_fkey` FOREIGN KEY (`assigneAId`) REFERENCES `personnes_ressources`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sous_taches` ADD CONSTRAINT `sous_taches_tacheId_fkey` FOREIGN KEY (`tacheId`) REFERENCES `taches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commentaires_taches` ADD CONSTRAINT `commentaires_taches_tacheId_fkey` FOREIGN KEY (`tacheId`) REFERENCES `taches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commentaires_taches` ADD CONSTRAINT `commentaires_taches_compteAccesId_fkey` FOREIGN KEY (`compteAccesId`) REFERENCES `comptes_acces`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commentaires_taches` ADD CONSTRAINT `commentaires_taches_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `commentaires_taches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `risques_projets` ADD CONSTRAINT `risques_projets_projetId_fkey` FOREIGN KEY (`projetId`) REFERENCES `projets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activites_taches` ADD CONSTRAINT `activites_taches_tacheId_fkey` FOREIGN KEY (`tacheId`) REFERENCES `taches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activites_taches` ADD CONSTRAINT `activites_taches_projetId_fkey` FOREIGN KEY (`projetId`) REFERENCES `projets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activites_taches` ADD CONSTRAINT `activites_taches_compteId_fkey` FOREIGN KEY (`compteId`) REFERENCES `comptes_acces`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `taches_periodiques` ADD CONSTRAINT `taches_periodiques_responsableId_fkey` FOREIGN KEY (`responsableId`) REFERENCES `personnes_ressources`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `taches_periodiques` ADD CONSTRAINT `taches_periodiques_entiteExecutionId_fkey` FOREIGN KEY (`entiteExecutionId`) REFERENCES `entites`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operations` ADD CONSTRAINT `operations_entiteId_fkey` FOREIGN KEY (`entiteId`) REFERENCES `entites`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operations` ADD CONSTRAINT `operations_responsableId_fkey` FOREIGN KEY (`responsableId`) REFERENCES `personnes_ressources`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operations` ADD CONSTRAINT `operations_projetSourceId_fkey` FOREIGN KEY (`projetSourceId`) REFERENCES `projets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `taches_operationnelles` ADD CONSTRAINT `taches_operationnelles_operationId_fkey` FOREIGN KEY (`operationId`) REFERENCES `operations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `taches_operationnelles` ADD CONSTRAINT `taches_operationnelles_responsableId_fkey` FOREIGN KEY (`responsableId`) REFERENCES `personnes_ressources`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `taches_operationnelles` ADD CONSTRAINT `taches_operationnelles_entiteId_fkey` FOREIGN KEY (`entiteId`) REFERENCES `entites`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `occurrences_taches` ADD CONSTRAINT `occurrences_taches_tacheOperationnelleId_fkey` FOREIGN KEY (`tacheOperationnelleId`) REFERENCES `taches_operationnelles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `occurrences_taches` ADD CONSTRAINT `occurrences_taches_realiseParId_fkey` FOREIGN KEY (`realiseParId`) REFERENCES `personnes_ressources`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commentaires_occurrences` ADD CONSTRAINT `commentaires_occurrences_occurrenceId_fkey` FOREIGN KEY (`occurrenceId`) REFERENCES `occurrences_taches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commentaires_occurrences` ADD CONSTRAINT `commentaires_occurrences_compteAccesId_fkey` FOREIGN KEY (`compteAccesId`) REFERENCES `comptes_acces`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commentaires_occurrences` ADD CONSTRAINT `commentaires_occurrences_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `commentaires_occurrences`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EquipeProjet` ADD CONSTRAINT `_EquipeProjet_A_fkey` FOREIGN KEY (`A`) REFERENCES `personnes_ressources`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EquipeProjet` ADD CONSTRAINT `_EquipeProjet_B_fkey` FOREIGN KEY (`B`) REFERENCES `projets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

