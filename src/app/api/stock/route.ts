import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recherche = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (recherche) {
      where.produit = {
        OR: [
          { code: { contains: recherche, mode: "insensitive" } },
          { designation: { contains: recherche, mode: "insensitive" } },
        ],
      };
    }

    const minQuantity = searchParams.get("minQuantity");
    const maxQuantity = searchParams.get("maxQuantity");
    
    if (minQuantity || maxQuantity) {
      const quantityFilter: Record<string, number> = {};
      if (minQuantity) quantityFilter.gte = parseInt(minQuantity);
      if (maxQuantity) quantityFilter.lte = parseInt(maxQuantity);
      where.stockActuel = quantityFilter;
    }

    const stocks = await prisma.stock.findMany({
      where,
      orderBy: { produit: { code: "asc" } },
      include: {
        produit: { select: { code: true, designation: true, unite: true, stockMin: true, categorie: true } },
      },
    });

    return NextResponse.json({ stocks });
  } catch (err) {
    console.error("Stock GET error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
