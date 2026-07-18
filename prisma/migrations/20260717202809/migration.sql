/*
  Warnings:

  - You are about to drop the column `address` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `cost_value` on the `stocks` table. All the data in the column will be lost.
  - You are about to drop the column `current_stock` on the `stocks` table. All the data in the column will be lost.
  - You are about to drop the column `initial_stock` on the `stocks` table. All the data in the column will be lost.
  - You are about to drop the column `potential_margin` on the `stocks` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `stocks` table. All the data in the column will be lost.
  - You are about to drop the column `sale_value` on the `stocks` table. All the data in the column will be lost.
  - You are about to drop the column `stock_status` on the `stocks` table. All the data in the column will be lost.
  - You are about to drop the column `total_purchases` on the `stocks` table. All the data in the column will be lost.
  - You are about to drop the column `total_sales` on the `stocks` table. All the data in the column will be lost.
  - You are about to drop the `parameters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `price_histories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `purchases` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sales` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `suppliers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[produit_id]` on the table `stocks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nom` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `marge_potentielle` to the `stocks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `produit_id` to the `stocks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stock_actuel` to the `stocks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stock_initial` to the `stocks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valeur_achat` to the `stocks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valeur_vente` to the `stocks` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "price_histories" DROP CONSTRAINT "price_histories_product_id_fkey";

-- DropForeignKey
ALTER TABLE "purchases" DROP CONSTRAINT "purchases_product_id_fkey";

-- DropForeignKey
ALTER TABLE "purchases" DROP CONSTRAINT "purchases_supplier_id_fkey";

-- DropForeignKey
ALTER TABLE "sales" DROP CONSTRAINT "sales_client_id_fkey";

-- DropForeignKey
ALTER TABLE "sales" DROP CONSTRAINT "sales_product_id_fkey";

-- DropForeignKey
ALTER TABLE "stocks" DROP CONSTRAINT "stocks_product_id_fkey";

-- DropIndex
DROP INDEX "stocks_product_id_key";

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "address",
DROP COLUMN "name",
DROP COLUMN "phone",
ADD COLUMN     "adresse" TEXT,
ADD COLUMN     "nom" TEXT NOT NULL,
ADD COLUMN     "telephone" TEXT;

-- AlterTable
ALTER TABLE "stocks" DROP COLUMN "cost_value",
DROP COLUMN "current_stock",
DROP COLUMN "initial_stock",
DROP COLUMN "potential_margin",
DROP COLUMN "product_id",
DROP COLUMN "sale_value",
DROP COLUMN "stock_status",
DROP COLUMN "total_purchases",
DROP COLUMN "total_sales",
ADD COLUMN     "marge_potentielle" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "produit_id" TEXT NOT NULL,
ADD COLUMN     "statut_stock" TEXT NOT NULL DEFAULT 'OK',
ADD COLUMN     "stock_actuel" INTEGER NOT NULL,
ADD COLUMN     "stock_initial" INTEGER NOT NULL,
ADD COLUMN     "total_achats" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_ventes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "valeur_achat" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "valeur_vente" DECIMAL(65,30) NOT NULL;

-- DropTable
DROP TABLE "parameters";

-- DropTable
DROP TABLE "price_histories";

-- DropTable
DROP TABLE "products";

-- DropTable
DROP TABLE "purchases";

-- DropTable
DROP TABLE "sales";

-- DropTable
DROP TABLE "suppliers";

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "produits" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "prix_achat_ref" DECIMAL(65,30) NOT NULL,
    "prix_vente_ref" DECIMAL(65,30) NOT NULL,
    "stock_initial" INTEGER NOT NULL,
    "stock_min" INTEGER NOT NULL DEFAULT 0,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mis_a_jour_le" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achats" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "numero_document" TEXT,
    "fournisseur_id" TEXT,
    "produit_id" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prix_unitaire" DECIMAL(65,30) NOT NULL,
    "montant_total" DECIMAL(65,30) NOT NULL,
    "mode_paiement" TEXT,
    "observation" TEXT,
    "ecart" DECIMAL(65,30),
    "alerte" BOOLEAN,

    CONSTRAINT "achats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventes" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "numero_vente" TEXT,
    "client_id" TEXT,
    "produit_id" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prix_unitaire" DECIMAL(65,30) NOT NULL,
    "montant_total" DECIMAL(65,30) NOT NULL,
    "mode_paiement" TEXT,
    "observation" TEXT,
    "ecart" DECIMAL(65,30),
    "alerte" BOOLEAN,

    CONSTRAINT "ventes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fournisseurs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT,
    "adresse" TEXT,
    "ice" TEXT,

    CONSTRAINT "fournisseurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mot_de_passe" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mis_a_jour_le" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametres" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "valeur" TEXT NOT NULL,

    CONSTRAINT "parametres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historique_prix" (
    "id" TEXT NOT NULL,
    "produit_id" TEXT NOT NULL,
    "ancien_prix_achat" DECIMAL(65,30),
    "nouveau_prix_achat" DECIMAL(65,30),
    "ancien_prix_vente" DECIMAL(65,30),
    "nouveau_prix_vente" DECIMAL(65,30),
    "date_modification" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raison" TEXT,

    CONSTRAINT "historique_prix_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "produits_code_key" ON "produits"("code");

-- CreateIndex
CREATE UNIQUE INDEX "fournisseurs_code_key" ON "fournisseurs"("code");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "parametres_cle_key" ON "parametres"("cle");

-- CreateIndex
CREATE UNIQUE INDEX "stocks_produit_id_key" ON "stocks"("produit_id");

-- AddForeignKey
ALTER TABLE "achats" ADD CONSTRAINT "achats_fournisseur_id_fkey" FOREIGN KEY ("fournisseur_id") REFERENCES "fournisseurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achats" ADD CONSTRAINT "achats_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_prix" ADD CONSTRAINT "historique_prix_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
