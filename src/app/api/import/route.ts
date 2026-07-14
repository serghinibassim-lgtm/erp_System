import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const HEADER_ALIASES: Record<string, string[]> = {
  code: ["code produit", "code"],
  designation: ["désignation", "designation", "produit"],
  category: ["catégorie", "categorie", "categorie"],
  unit: ["unité de mesure", "unité", "unite", "unite de mesure"],
  purchasePrice: ["prix achat référence", "prix achat source", "prix achat ref", "prix achat"],
  salePrice: ["prix vente référence", "prix vente source", "prix vente ref", "prix vente"],
  stock: ["stock initial", "stock"],
  minStock: ["stock minimum", "stock min"],
};

function findColumn(header: string[], aliases: string[]): number {
  const lower = header.map(h => String(h).toLowerCase().trim());
  for (const alias of aliases) {
    const idx = lower.indexOf(alias.toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseNumber(val: unknown): number {
  if (val == null || val === "") return 0;
  const str = String(val).trim().replace(",", ".");
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let xlsx: typeof import("xlsx");
    try {
      xlsx = require("xlsx");
    } catch {
      return NextResponse.json({ error: "Module xlsx indisponible" }, { status: 500 });
    }

    const wb = xlsx.read(buffer, { type: "buffer" });

    const results = { produits: 0, achats: 0, ventes: 0, errors: [] as string[] };

    // --- Import PRODUITS ---
    if (wb.SheetNames.includes("PRODUITS")) {
      const sheet = xlsx.utils.sheet_to_json(wb.Sheets["PRODUITS"], { header: 1, defval: "" }) as unknown[][];
      const header = (sheet[0] || []).map(h => String(h).trim());
      const col = {
        code: findColumn(header, HEADER_ALIASES.code),
        designation: findColumn(header, HEADER_ALIASES.designation),
        category: findColumn(header, HEADER_ALIASES.category),
        unit: findColumn(header, HEADER_ALIASES.unit),
        purchasePrice: findColumn(header, HEADER_ALIASES.purchasePrice),
        salePrice: findColumn(header, HEADER_ALIASES.salePrice),
        stock: findColumn(header, HEADER_ALIASES.stock),
        minStock: findColumn(header, HEADER_ALIASES.minStock),
      };

      if (col.code === -1 || col.designation === -1) {
        return NextResponse.json({
          success: false,
          message: "Colonnes 'Code produit' et 'Désignation' introuvables dans la feuille PRODUITS",
          results,
        });
      }

      for (let i = 1; i < sheet.length; i++) {
        const row = sheet[i];
        const code = String(row[col.code] || "").trim();
        const designation = String(row[col.designation] || "").trim();

        if (!code || !designation) continue;

        const category = col.category !== -1 ? String(row[col.category] || "").trim() : "Général";
        const unit = col.unit !== -1 ? String(row[col.unit] || "").trim() : "pièce";
        const initialStock = col.stock !== -1 ? parseInt(String(row[col.stock] || "0")) || 0 : 0;
        const minStock = col.minStock !== -1 ? parseInt(String(row[col.minStock] || "0")) || 0 : 0;
        const purchasePrice = col.purchasePrice !== -1 ? parseNumber(row[col.purchasePrice]) : 0;
        const salePrice = col.salePrice !== -1 ? parseNumber(row[col.salePrice]) : 0;

        try {
          const existing = await prisma.product.findUnique({ where: { code } });
          if (existing) {
            await prisma.product.update({
              where: { code },
              data: {
                designation,
                category: category || existing.category,
                unit: unit || existing.unit,
                purchaseRefPrice: purchasePrice || existing.purchaseRefPrice,
                saleRefPrice: salePrice || existing.saleRefPrice,
                initialStock: initialStock || existing.initialStock,
                minStock: minStock || existing.minStock,
              },
            });
          } else {
            await prisma.product.create({
              data: {
                code,
                designation,
                category: category || "Général",
                unit: unit || "pièce",
                purchaseRefPrice: purchasePrice || 0,
                saleRefPrice: salePrice || 0,
                initialStock,
                minStock,
              },
            });
          }

          const p = await prisma.product.findUnique({ where: { code } });
          if (p) {
            const stock = await prisma.stock.findUnique({ where: { productId: p.id } });
            if (!stock) {
              const currentStock = initialStock;
              await prisma.stock.create({
                data: {
                  productId: p.id,
                  initialStock,
                  currentStock,
                  stockStatus: currentStock <= minStock ? "Alerte" : "OK",
                  costValue: Number(p.purchaseRefPrice) * currentStock,
                  saleValue: Number(p.saleRefPrice) * currentStock,
                  potentialMargin: (Number(p.saleRefPrice) - Number(p.purchaseRefPrice)) * currentStock,
                },
              });
            } else {
              const currentStock = stock.initialStock + stock.totalPurchases - stock.totalSales + initialStock - stock.initialStock;
              await prisma.stock.update({
                where: { productId: p.id },
                data: {
                  initialStock,
                  currentStock,
                  stockStatus: currentStock <= minStock ? "Alerte" : "OK",
                  costValue: Number(p.purchaseRefPrice) * currentStock,
                  saleValue: Number(p.saleRefPrice) * currentStock,
                  potentialMargin: (Number(p.saleRefPrice) - Number(p.purchaseRefPrice)) * currentStock,
                },
              });
            }
          }

          results.produits++;
        } catch (err) {
          results.errors.push(`Produit ${code}: ${err instanceof Error ? err.message : "Erreur"}`);
        }
      }
    }

    // --- Import VENTES ---
    if (wb.SheetNames.includes("VENTES")) {
      const sheet = xlsx.utils.sheet_to_json(wb.Sheets["VENTES"], { header: 1, defval: "" }) as unknown[][];
      const header = (sheet[0] || []).map(h => String(h).trim());
      const colCode = findColumn(header, HEADER_ALIASES.code);
      const colQty = header.findIndex(h => /quantité|quantite|qté|qte|quantite/i.test(h));
      const colPrice = header.findIndex(h => /prix.*vente|prix/i.test(h));

      const codeIdx = colCode !== -1 ? colCode : 2;
      const qtyIdx = colQty !== -1 ? colQty : 5;
      const priceIdx = colPrice !== -1 ? colPrice : 6;

      for (let i = 1; i < sheet.length; i++) {
        const row = sheet[i];
        const code = String(row[codeIdx] || "").trim();
        const qty = parseInt(String(row[qtyIdx] || "0"));
        const price = parseNumber(row[priceIdx]);

        if (!code || qty <= 0) continue;

        try {
          const product = await prisma.product.findUnique({ where: { code } });
          if (!product) continue;

          const total = qty * price;
          const deviation = price < Number(product.saleRefPrice)
            ? Number(product.saleRefPrice) - price
            : null;

          await prisma.sale.create({
            data: {
              date: new Date("2024-01-01"),
              saleNumber: `HIST-${code}`,
              clientId: null,
              productId: product.id,
              quantity: qty,
              unitPrice: price,
              totalAmount: total,
              deviation,
              alert: deviation != null && deviation > 0,
            },
          });

          const stock = await prisma.stock.findUnique({ where: { productId: product.id } });
          if (stock) {
            const newTotalSales = stock.totalSales + qty;
            const newCurrentStock = stock.initialStock + stock.totalPurchases - newTotalSales;
            await prisma.stock.update({
              where: { productId: product.id },
              data: {
                totalSales: newTotalSales,
                currentStock: newCurrentStock,
                stockStatus: newCurrentStock <= product.minStock ? "Alerte" : "OK",
                costValue: Number(product.purchaseRefPrice) * newCurrentStock,
                saleValue: Number(product.saleRefPrice) * newCurrentStock,
                potentialMargin: (Number(product.saleRefPrice) - Number(product.purchaseRefPrice)) * newCurrentStock,
              },
            });
          }

          results.ventes++;
        } catch (err) {
          results.errors.push(`Vente ${code}: ${err instanceof Error ? err.message : "Erreur"}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import terminé : ${results.produits} produit(s), ${results.ventes} vente(s) historique(s)`,
      results,
    });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({
      error: "Erreur lors de l'import",
      detail: err instanceof Error ? err.message : "Erreur inconnue",
    }, { status: 500 });
  }
}
