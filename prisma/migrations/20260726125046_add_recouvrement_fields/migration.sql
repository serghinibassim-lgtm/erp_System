-- AlterTable
ALTER TABLE "ventes" ADD COLUMN     "date_limite_paiement" TIMESTAMP(3),
ADD COLUMN     "paye" BOOLEAN NOT NULL DEFAULT false;
