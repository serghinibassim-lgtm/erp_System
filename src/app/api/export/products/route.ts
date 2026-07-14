import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { code: "asc" },
      include: { stock: true },
    });

    const header = "Code;Désignation;Catégorie;Unité;Prix achat réf;Prix vente réf;Stock initial;Stock minimum;Stock actuel;Statut";
    const rows = products.map(p =>
      [
        p.code,
        p.designation,
        p.category,
        p.unit,
        Number(p.purchaseRefPrice).toFixed(2),
        Number(p.saleRefPrice).toFixed(2),
        p.initialStock,
        p.minStock,
        p.stock?.currentStock ?? 0,
        p.stock?.stockStatus ?? "N/A",
      ].join(";")
    );

    const csv = "\ufeff" + header + "\n" + rows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="produits_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error("Export products error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
