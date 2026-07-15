import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const produits = await prisma.produit.findMany({
      orderBy: { code: "asc" },
      include: { stock: true },
    });

    const header = "Code;Désignation;Catégorie;Unité;Prix achat réf;Prix vente réf;Stock initial;Stock minimum;Stock actuel;Statut";
    const rows = produits.map(p =>
      [
        p.code,
        p.designation,
        p.categorie,
        p.unite,
        Number(p.prixAchatRef).toFixed(2),
        Number(p.prixVenteRef).toFixed(2),
        p.stockInitial,
        p.stockMin,
        p.stock?.stockActuel ?? 0,
        p.stock?.statutStock ?? "N/A",
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
    console.error("Export produits error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
