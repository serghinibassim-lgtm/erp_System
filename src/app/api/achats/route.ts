import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getNextNumeroDocument } from "@/lib/sequence";

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
    let { date, numeroDocument, fournisseurId, modePaiement, observation, lineItems, produitId, quantite, prixUnitaire, montantTotal } = body;

    // Support both single item and lineItems array
    const items = lineItems || [{ produitId, quantite, prixUnitaire, montantTotal }];

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Aucun produit fourni", errors: { lineItems: "Ajoutez au moins un produit" } }, { status: 400 });
    }

    const errors: Record<string, string> = {};
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.produitId) errors[`lineItems.${i}.produitId`] = "Le produit est requis";
      if (!item.quantite || isNaN(Number(item.quantite)) || Number(item.quantite) <= 0) errors[`lineItems.${i}.quantite`] = "La quantité doit être > 0";
      if (item.prixUnitaire == null || isNaN(Number(item.prixUnitaire))) errors[`lineItems.${i}.prixUnitaire`] = "Le prix unitaire est requis";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validation échouée", errors }, { status: 400 });
    }

    const dateDoc = date ? new Date(date) : new Date();
    if (!numeroDocument) {
      numeroDocument = await prisma.$transaction((tx) => getNextNumeroDocument(tx, "achat", dateDoc));
    }

    const achats: unknown[] = [];

    for (const item of items) {
      const produit = await prisma.produit.findUnique({ where: { id: item.produitId } });
      if (!produit) {
        return NextResponse.json({ error: `Produit introuvable: ${item.produitId}` }, { status: 404 });
      }

      const qty = parseInt(item.quantite);
      const price = parseFloat(item.prixUnitaire);
      const total = item.montantTotal != null ? parseFloat(item.montantTotal) : qty * price;

      const ecart = price > Number(produit.prixAchatRef)
        ? price - Number(produit.prixAchatRef)
        : null;

      const thresholdParam = await prisma.parametre.findUnique({ where: { cle: "purchase_alert_threshold" } });
      const threshold = thresholdParam ? parseFloat(thresholdParam.valeur) : 0;
      const alerte = ecart != null && ecart > threshold;

      const achat = await prisma.$transaction(async (tx) => {
        const newAchat = await tx.achat.create({
          data: {
            date: dateDoc,
            numeroDocument: numeroDocument || null,
            fournisseurId: fournisseurId || null,
            produitId: item.produitId,
            quantite: qty,
            prixUnitaire: price,
            montantTotal: total,
            modePaiement: modePaiement || null,
            observation: observation || null,
            ecart: ecart || null,
            alerte,
          },
        });

        const stock = await tx.stock.findUnique({ where: { produitId: item.produitId } });
        if (stock) {
          const newTotalAchats = stock.totalAchats + qty;
          const newStockActuel = stock.stockInitial + newTotalAchats - stock.totalVentes;
          const newValeurAchat = Number(produit.prixAchatRef) * newStockActuel;
          const newValeurVente = Number(produit.prixVenteRef) * newStockActuel;
          const newMargePotentielle = newValeurVente - newValeurAchat;

          await tx.stock.update({
            where: { produitId: item.produitId },
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

      achats.push(achat);
    }

    return NextResponse.json({ achats, count: achats.length, numeroDocument }, { status: 201 });
  } catch (err) {
    console.error("Achats POST error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
