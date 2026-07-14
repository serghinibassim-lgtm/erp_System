import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const stocks = await prisma.stock.findMany({
      orderBy: { product: { code: "asc" } },
      include: {
        product: { select: { code: true, designation: true, unit: true, minStock: true } },
      },
    });

    const header = "Code;Désignation;Unité;Stock initial;Achats;Ventes;Stock actuel;Seuil min;Statut;Valeur coût;Valeur vente;Marge potentielle";
    const rows = stocks.map(s =>
      [
        s.product.code,
        s.product.designation,
        s.product.unit,
        s.initialStock,
        s.totalPurchases,
        s.totalSales,
        s.currentStock,
        s.product.minStock,
        s.stockStatus,
        Number(s.costValue).toFixed(2),
        Number(s.saleValue).toFixed(2),
        Number(s.potentialMargin).toFixed(2),
      ].join(";")
    );

    const csv = "\ufeff" + header + "\n" + rows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="stock_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error("Export stock error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
