import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const stocks = await prisma.stock.findMany({
      orderBy: { produit: { code: "asc" } },
      include: {
        produit: { select: { code: true, designation: true, unite: true, stockMin: true } },
      },
    });

    const header = "Code;Désignation;Unité;Stock initial;Achats;Ventes;Stock actuel;Seuil min;Statut;Valeur coût;Valeur vente;Marge potentielle";
    const rows = stocks.map(s =>
      [
        s.produit.code,
        s.produit.designation,
        s.produit.unite,
        s.stockInitial,
        s.totalAchats,
        s.totalVentes,
        s.stockActuel,
        s.produit.stockMin,
        s.statutStock,
        Number(s.valeurAchat).toFixed(2),
        Number(s.valeurVente).toFixed(2),
        Number(s.margePotentielle).toFixed(2),
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
