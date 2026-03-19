-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_comptes_acces" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "login" TEXT,
    "estSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "personneId" TEXT,
    "motDePasseHash" TEXT NOT NULL,
    "estActif" BOOLEAN NOT NULL DEFAULT true,
    "doitChangerMdp" BOOLEAN NOT NULL DEFAULT true,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateDerniereConnex" DATETIME,
    CONSTRAINT "comptes_acces_personneId_fkey" FOREIGN KEY ("personneId") REFERENCES "personnes_ressources" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_comptes_acces" ("dateCreation", "dateDerniereConnex", "doitChangerMdp", "estActif", "id", "motDePasseHash", "personneId") SELECT "dateCreation", "dateDerniereConnex", "doitChangerMdp", "estActif", "id", "motDePasseHash", "personneId" FROM "comptes_acces";
DROP TABLE "comptes_acces";
ALTER TABLE "new_comptes_acces" RENAME TO "comptes_acces";
CREATE UNIQUE INDEX "comptes_acces_login_key" ON "comptes_acces"("login");
CREATE UNIQUE INDEX "comptes_acces_personneId_key" ON "comptes_acces"("personneId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
