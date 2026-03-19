-- CreateTable
CREATE TABLE "comptes_acces" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personneId" TEXT NOT NULL,
    "motDePasseHash" TEXT NOT NULL,
    "estActif" BOOLEAN NOT NULL DEFAULT true,
    "doitChangerMdp" BOOLEAN NOT NULL DEFAULT true,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateDerniereConnex" DATETIME,
    CONSTRAINT "comptes_acces_personneId_fkey" FOREIGN KEY ("personneId") REFERENCES "personnes_ressources" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "permissions_page_action" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "compteId" TEXT NOT NULL,
    "pageKey" TEXT NOT NULL,
    "actionKey" TEXT NOT NULL,
    "autorise" BOOLEAN NOT NULL DEFAULT false,
    "dateMaj" DATETIME NOT NULL,
    CONSTRAINT "permissions_page_action_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes_acces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions_auth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "compteId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expireLe" DATETIME NOT NULL,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_auth_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes_acces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "comptes_acces_personneId_key" ON "comptes_acces"("personneId");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_page_action_compteId_pageKey_actionKey_key" ON "permissions_page_action"("compteId", "pageKey", "actionKey");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_auth_token_key" ON "sessions_auth"("token");
