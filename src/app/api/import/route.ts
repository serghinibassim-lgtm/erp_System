import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
      const sheet = xlsx.utils.sheet_to_json(wb.Sheets["PRODUITS"], { header: 1, defval: "" }) as string[][];
      for (let i = 1; i < sheet.length; i++) {
        const row = sheet[i];
        const code = String(row[0] || "").trim();
        const designation = String(row[1] || "").trim();
        const stockStr = String(row[2] || "0").trim();
        const purchasePrice = parseFloat(String(row[3] || "0").replace(",", "."));
        const salePrice = parseFloat(String(row[4] || "0").replace(",", "."));

        if (!code || !designation) continue;

        const initialStock = parseInt(stockStr) || 0;

        try {
          const existing = await prisma.product.findUnique({ where: { code } });
          if (existing) {
            await prisma.product.update({
              where: { code },
              data: {
                designation,
                purchaseRefPrice: purchasePrice || existing.purchaseRefPrice,
                saleRefPrice: salePrice || existing.saleRefPrice,
                initialStock: initialStock || existing.initialStock,
              },
            });
          } else {
            await prisma.product.create({
              data: {
                code,
                designation,
                category: "Général",
                unit: "pièce",
                purchaseRefPrice: purchasePrice || 0,
                saleRefPrice: salePrice || 0,
                initialStock,
                minStock: 0,
              },
            });
          }

          const p = await prisma.product.findUnique({ where: { code } });
          if (p) {
            const stock = await prisma.stock.findUnique({ where: { productId: p.id } });
            if (!stock) {
              await prisma.stock.create({
                data: {
                  productId: p.id,
                  initialStock,
                  currentStock: initialStock,
                  stockStatus: initialStock <= 0 ? "Alerte" : "OK",
                  costValue: purchasePrice * initialStock,
                  saleValue: salePrice * initialStock,
                  potentialMargin: (salePrice - purchasePrice) * initialStock,
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

    // --- Import VENTES from PRODUITS (historic sales) ---
    if (wb.SheetNames.includes("VENTES")) {
      const sheet = xlsx.utils.sheet_to_json(wb.Sheets["VENTES"], { header: 1, defval: "" }) as string[][];
      for (let i = 1; i < sheet.length; i++) {
        const row = sheet[i];
        const code = String(row[2] || "").trim();
        const qty = parseInt(String(row[5] || "0"));
        const price = parseFloat(String(row[6] || "0").replace(",", "."));

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

          // Update stock
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
