/*
  Warnings:

  - You are about to drop the column `contact` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `contact` on the `fournisseurs` table. All the data in the column will be lost.
  - Made the column `telephone` on table `clients` required. This step will fail if there are existing NULL values in that column.
  - Made the column `telephone` on table `fournisseurs` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "clients" DROP COLUMN "contact",
ALTER COLUMN "telephone" SET NOT NULL;

-- AlterTable
ALTER TABLE "fournisseurs" DROP COLUMN "contact",
ALTER COLUMN "telephone" SET NOT NULL;
