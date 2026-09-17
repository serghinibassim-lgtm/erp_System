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
    let { date, numeroVente, clientId, modePaiement, dateLimitePaiement, observation, lineItems, produitId, quantite, prixUnitaire, montantTotal } = body;

    const items = lineItems || [{ produitId, quantite, prixUnitaire, montantTotal }];

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Aucun produit fourni", errors: { lineItems: "Ajoutez au moins un produit" } }, { status: 400 });
    }

    const errors: Record<string, string> = {};

    if (!clientId || String(clientId).trim() === "") {
      errors.clientId = "Le client est obligatoire";
    }
    if (!modePaiement || String(modePaiement).trim() === "") {
      errors.modePaiement = "Le mode de paiement est obligatoire";
    }
    if (String(modePaiement || "").trim().toLowerCase() === "crédit") {
      if (!dateLimitePaiement) {
        errors.dateLimitePaiement = "La date limite de paiement est obligatoire pour une vente à crédit";
      } else {
        const limite = new Date(dateLimitePaiement);
        if (isNaN(limite.getTime())) {
          errors.dateLimitePaiement = "La date limite de paiement est invalide";
        } else {
          const aujourdhui = new Date();
          aujourdhui.setHours(0, 0, 0, 0);
          const jourLimite = new Date(limite);
          jourLimite.setHours(0, 0, 0, 0);
          if (jourLimite < aujourdhui) {
            errors.dateLimitePaiement = "Interdit : la date limite de paiement est déjà dépassée";
          }
        }
      }
    }
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.produitId) errors[`lineItems.${i}.produitId`] = "Le produit est requis";
      if (!item.quantite || isNaN(Number(item.quantite)) || Number(item.quantite) <= 0) errors[`lineItems.${i}.quantite`] = "La quantité doit être > 0";
      if (item.prixUnitaire == null || isNaN(Number(item.prixUnitaire))) errors[`lineItems.${i}.prixUnitaire`] = "Le prix unitaire est requis";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validation échouée", errors }, { status: 400 });
    }

    // Vérifier que le client existe
    const client = await prisma.client.findUnique({ where: { id: String(clientId) } });
    if (!client) {
      return NextResponse.json({ error: "Client introuvable", errors: { clientId: "Le client sélectionné est introuvable" } }, { status: 400 });
    }

    const dateDoc = date ? new Date(date) : new Date();
    if (!numeroVente) {
      numeroVente = await prisma.$transaction((tx) => getNextNumeroDocument(tx, "vente", dateDoc));
    }

    const ventes: unknown[] = [];

    for (const item of items) {
      const produit = await prisma.produit.findUnique({
        where: { id: item.produitId },
        include: { stock: true },
      });
      if (!produit) {
        return NextResponse.json({ error: `Produit introuvable: ${item.produitId}` }, { status: 404 });
      }

      const stockActuel = produit.stock?.stockActuel ?? 0;
      if (item.quantite > stockActuel) {
        return NextResponse.json({
          error: `Stock insuffisant pour ${produit.code}`,
          errors: { [`lineItems.${items.indexOf(item)}.quantite`]: `Stock disponible: ${stockActuel}` },
        }, { status: 400 });
      }
      const qty = parseInt(item.quantite);
      const price = parseFloat(item.prixUnitaire);
      const total = item.montantTotal != null ? parseFloat(item.montantTotal) : qty * price;

      const prixRef = Number(produit.prixVenteRef);
      const ecart = price < prixRef
        ? prixRef - price
        : null;

      const seuilParam = await prisma.parametre.findUnique({ where: { cle: "seuil_alerte_vente" } });
      const seuilPourcent = seuilParam ? parseFloat(seuilParam.valeur) : 0;
      let alerte = false;
      if (ecart != null) {
        if (prixRef > 0) {
          const pourcentageEcart = (ecart / prixRef) * 100;
          alerte = pourcentageEcart > seuilPourcent;
        } else {
          alerte = ecart > seuilPourcent;
        }
      }
      const vente = await prisma.$transaction(async (tx) => {
        const newVente = await tx.vente.create({
          data: {
            date: dateDoc,
            numeroVente: numeroVente || null,
            clientId: String(clientId),
            produitId: item.produitId,
            quantite: qty,
            prixUnitaire: price,
            montantTotal: total,
            modePaiement: String(modePaiement),
            dateLimitePaiement: dateLimitePaiement ? new Date(dateLimitePaiement) : null,
            observation: observation || null,
            ecart: ecart || null,
            alerte,
          },
        });
        const stock = await tx.stock.findUnique({ where: { produitId: item.produitId } });
        if (stock) {
          const newTotalVentes = stock.totalVentes + qty;
          const newStockActuel = stock.stockInitial + stock.totalAchats - newTotalVentes;
          const newValeurAchat = Number(produit.prixAchatRef) * newStockActuel;
          const newValeurVente = Number(produit.prixVenteRef) * newStockActuel;
          const newMargePotentielle = newValeurVente - newValeurAchat;

          await tx.stock.update({
            where: { produitId: item.produitId },
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


      ventes.push(vente);
    }

    return NextResponse.json({ ventes, count: ventes.length, numeroVente }, { status: 201 });
  } catch (err) {
    console.error("Ventes POST error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
