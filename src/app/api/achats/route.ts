import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    const recherche = searchParams.get("search") || "";
    if (recherche) {
      where.produit = {
        OR: [
          { code: { contains: recherche, mode: "insensitive" } },
          { designation: { contains: recherche, mode: "insensitive" } },
        ],
      };
    }

    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, unknown> = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo + "T23:59:59.999Z");
      where.date = dateFilter;
    }

    const minQuantity = searchParams.get("minQuantity");
    const maxQuantity = searchParams.get("maxQuantity");
    if (minQuantity || maxQuantity) {
      const quantityFilter: Record<string, number> = {};
      if (minQuantity) quantityFilter.gte = parseInt(minQuantity);
      if (maxQuantity) quantityFilter.lte = parseInt(maxQuantity);
      where.quantite = quantityFilter;
    }

    const [achats, total] = await Promise.all([
      prisma.achat.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
        include: {
          produit: { select: { code: true, designation: true } },
          fournisseur: { select: { nom: true } },
        },
      }),
      prisma.achat.count({ where }),
    ]);

    return NextResponse.json({
      achats,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Achats GET error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, numeroDocument, fournisseurId, produitId, quantite, prixUnitaire, montantTotal, modePaiement, observation } = body;

    const errors: Record<string, string> = {};
    if (!produitId) errors.produitId = "Le produit est requis";
    if (!quantite || isNaN(Number(quantite)) || Number(quantite) <= 0) errors.quantite = "La quantité doit être > 0";
    if (prixUnitaire == null || isNaN(Number(prixUnitaire))) errors.prixUnitaire = "Le prix unitaire est requis";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validation échouée", errors }, { status: 400 });
    }

    const produit = await prisma.produit.findUnique({ where: { id: produitId } });
    if (!produit) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    const qty = parseInt(quantite);
    const price = parseFloat(prixUnitaire);
    const total = montantTotal != null ? parseFloat(montantTotal) : qty * price;

    const ecart = price > Number(produit.prixAchatRef)
      ? price - Number(produit.prixAchatRef)
      : null;

    const thresholdParam = await prisma.parametre.findUnique({ where: { cle: "purchase_alert_threshold" } });
    const threshold = thresholdParam ? parseFloat(thresholdParam.valeur) : 0;
    const alerte = ecart != null && ecart > threshold;

    const achat = await prisma.$transaction(async (tx) => {
      const newAchat = await tx.achat.create({
        data: {
          date: date ? new Date(date) : new Date(),
          numeroDocument: numeroDocument || null,
          fournisseurId: fournisseurId || null,
          produitId,
          quantite: qty,
          prixUnitaire: price,
          montantTotal: total,
          modePaiement: modePaiement || null,
          observation: observation || null,
          ecart: ecart || null,
          alerte,
        },
      });

      const stock = await tx.stock.findUnique({ where: { produitId } });
      if (stock) {
        const newTotalAchats = stock.totalAchats + qty;
        const newStockActuel = stock.stockInitial + newTotalAchats - stock.totalVentes;
        const newValeurAchat = Number(produit.prixAchatRef) * newStockActuel;
        const newValeurVente = Number(produit.prixVenteRef) * newStockActuel;
        const newMargePotentielle = newValeurVente - newValeurAchat;

        await tx.stock.update({
          where: { produitId },
          data: {
            totalAchats: newTotalAchats,
            stockActuel: newStockActuel,
            statutStock: newStockActuel <= produit.stockMin ? "Alerte" : "OK",
            valeurAchat: newValeurAchat,
            valeurVente: newValeurVente,
            margePotentielle: newMargePotentielle,
          },
        });
      }

      return newAchat;
    });

    return NextResponse.json({ achat }, { status: 201 });
  } catch (err) {
    console.error("Achats POST error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
