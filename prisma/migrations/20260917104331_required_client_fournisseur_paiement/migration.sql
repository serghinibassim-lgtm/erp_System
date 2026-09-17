/*
  Warnings:

  - Made the column `fournisseur_id` on table `achats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mode_paiement` on table `achats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `client_id` on table `ventes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mode_paiement` on table `ventes` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "achats" DROP CONSTRAINT "achats_fournisseur_id_fkey";

-- DropForeignKey
ALTER TABLE "ventes" DROP CONSTRAINT "ventes_client_id_fkey";

-- AlterTable
ALTER TABLE "achats" ALTER COLUMN "fournisseur_id" SET NOT NULL,
ALTER COLUMN "mode_paiement" SET NOT NULL;

-- AlterTable
ALTER TABLE "ventes" ALTER COLUMN "client_id" SET NOT NULL,
ALTER COLUMN "mode_paiement" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "achats" ADD CONSTRAINT "achats_fournisseur_id_fkey" FOREIGN KEY ("fournisseur_id") REFERENCES "fournisseurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
