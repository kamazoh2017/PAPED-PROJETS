-- CreateTable
CREATE TABLE "sous_taches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tacheId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "estFaite" BOOLEAN NOT NULL DEFAULT false,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sous_taches_tacheId_fkey" FOREIGN KEY ("tacheId") REFERENCES "taches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
