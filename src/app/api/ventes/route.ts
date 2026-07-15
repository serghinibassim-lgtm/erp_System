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

    const [ventes, total] = await Promise.all([
      prisma.vente.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
        include: {
          produit: { select: { code: true, designation: true } },
          client: { select: { nom: true } },
        },
      }),
      prisma.vente.count({ where }),
    ]);

    return NextResponse.json({
      ventes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Ventes GET error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, numeroVente, clientId, produitId, quantite, prixUnitaire, montantTotal, modePaiement, observation } = body;

    const errors: Record<string, string> = {};
    if (!produitId) errors.produitId = "Le produit est requis";
    if (!quantite || isNaN(Number(quantite)) || Number(quantite) <= 0) errors.quantite = "La quantité doit être > 0";
    if (prixUnitaire == null || isNaN(Number(prixUnitaire))) errors.prixUnitaire = "Le prix unitaire est requis";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validation échouée", errors }, { status: 400 });
    }

    const produit = await prisma.produit.findUnique({
      where: { id: produitId },
      include: { stock: true },
    });
    if (!produit) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    const stockActuel = produit.stock?.stockActuel ?? 0;
    if (quantite > stockActuel) {
      return NextResponse.json({
        error: "Stock insuffisant",
        errors: { quantite: `Stock disponible: ${stockActuel}` },
      }, { status: 400 });
    }

    const qty = parseInt(quantite);
    const price = parseFloat(prixUnitaire);
    const total = montantTotal != null ? parseFloat(montantTotal) : qty * price;

    const ecart = price < Number(produit.prixVenteRef)
      ? Number(produit.prixVenteRef) - price
      : null;

    const thresholdParam = await prisma.parametre.findUnique({ where: { cle: "sale_alert_threshold" } });
    const threshold = thresholdParam ? parseFloat(thresholdParam.valeur) : 0;
    const alerte = ecart != null && ecart > threshold;

    const vente = await prisma.$transaction(async (tx) => {
      const newVente = await tx.vente.create({
        data: {
          date: date ? new Date(date) : new Date(),
          numeroVente: numeroVente || null,
          clientId: clientId || null,
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
        const newTotalVentes = stock.totalVentes + qty;
        const newStockActuel = stock.stockInitial + stock.totalAchats - newTotalVentes;
        const newValeurAchat = Number(produit.prixAchatRef) * newStockActuel;
        const newValeurVente = Number(produit.prixVenteRef) * newStockActuel;
        const newMargePotentielle = newValeurVente - newValeurAchat;

        await tx.stock.update({
          where: { produitId },
          data: {
            totalVentes: newTotalVentes,
            stockActuel: newStockActuel,
            statutStock: newStockActuel <= produit.stockMin ? "Alerte" : "OK",
            valeurAchat: newValeurAchat,
            valeurVente: newValeurVente,
            margePotentielle: newMargePotentielle,
          },
        });
      }

      return newVente;
    });

    return NextResponse.json({ vente }, { status: 201 });
  } catch (err) {
    console.error("Ventes POST error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
