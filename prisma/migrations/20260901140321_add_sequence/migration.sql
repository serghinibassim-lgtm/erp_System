-- CreateTable
CREATE TABLE "sequences" (
    "cle" TEXT NOT NULL,
    "prefixe" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "dernierN" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sequences_pkey" PRIMARY KEY ("cle")
);
