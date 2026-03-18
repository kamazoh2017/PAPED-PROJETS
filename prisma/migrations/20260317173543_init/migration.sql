-- CreateTable
CREATE TABLE "projets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'Demarrage',
    "chefProjetId" TEXT NOT NULL,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "projets_chefProjetId_fkey" FOREIGN KEY ("chefProjetId") REFERENCES "personnes_ressources" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "entites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "libelle" TEXT NOT NULL,
    "tutelle" TEXT
);

-- CreateTable
CREATE TABLE "personnes_ressources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "prenoms" TEXT NOT NULL,
    "telephone" TEXT,
    "email" TEXT NOT NULL,
    "fonction" TEXT NOT NULL,
    "entiteId" TEXT NOT NULL,
    "estChefProjet" BOOLEAN NOT NULL DEFAULT false,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "personnes_ressources_entiteId_fkey" FOREIGN KEY ("entiteId") REFERENCES "entites" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "parties_prenantes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "libelle" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entiteId" TEXT,
    "responsableId" TEXT,
    CONSTRAINT "parties_prenantes_entiteId_fkey" FOREIGN KEY ("entiteId") REFERENCES "entites" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "parties_prenantes_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "personnes_ressources" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "parties_prenantes_projets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projetId" TEXT NOT NULL,
    "partiePrenantId" TEXT NOT NULL,
    CONSTRAINT "parties_prenantes_projets_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "parties_prenantes_projets_partiePrenantId_fkey" FOREIGN KEY ("partiePrenantId") REFERENCES "parties_prenantes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "taches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projetId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "priorite" TEXT NOT NULL DEFAULT 'Moyenne',
    "assigneAId" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'Backlog',
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateDebutPrevisionnelle" DATETIME,
    "dateDebutEffective" DATETIME,
    "dateFinPrevisionnelle" DATETIME,
    "dateFinEffective" DATETIME,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "taches_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "taches_assigneAId_fkey" FOREIGN KEY ("assigneAId") REFERENCES "personnes_ressources" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "taches_periodiques" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "periodicite" TEXT NOT NULL,
    "dateDebut" DATETIME NOT NULL,
    "dateFin" DATETIME,
    "responsableId" TEXT NOT NULL,
    "entiteExecutionId" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'A faire',
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "taches_periodiques_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "personnes_ressources" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "taches_periodiques_entiteExecutionId_fkey" FOREIGN KEY ("entiteExecutionId") REFERENCES "entites" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_EquipeProjet" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_EquipeProjet_A_fkey" FOREIGN KEY ("A") REFERENCES "personnes_ressources" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EquipeProjet_B_fkey" FOREIGN KEY ("B") REFERENCES "projets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "projets_libelle_key" ON "projets"("libelle");

-- CreateIndex
CREATE UNIQUE INDEX "entites_libelle_key" ON "entites"("libelle");

-- CreateIndex
CREATE UNIQUE INDEX "personnes_ressources_email_key" ON "personnes_ressources"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_EquipeProjet_AB_unique" ON "_EquipeProjet"("A", "B");

-- CreateIndex
CREATE INDEX "_EquipeProjet_B_index" ON "_EquipeProjet"("B");
