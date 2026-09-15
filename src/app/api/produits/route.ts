import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recherche = searchParams.get("search") || "";
    const categorie = searchParams.get("categoier") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;



    const where: Record<string, unknown> = {};
    if (recherche) {
      where.OR = [
        { code: { contains: recherche, mode: "insensitive" } },
        { designation: { contains: recherche, mode: "insensitive" } },
      ];
    }
    if (categorie) {
      where.categorie= categorie;
    }

    const [produits, total] = await Promise.all([
      prisma.produit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { creeLe: "desc" },
        include: { stock: true },
      }),
      prisma.produit.count({ where }),
    ]);

    return NextResponse.json({
      produits,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Produits GET error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}



export async function POST(request: NextRequest) {
  const auth = requireRole(request, ["RESPONSABLE"]);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { code, designation, categorie, unite, prixAchatRef, prixVenteRef, stockInitial, stockMin } = body;

    const errors: Record<string, string> = {};
    if (!code || !code.trim()) errors.code = "Le code est requis";
    if (!designation || !designation.trim()) errors.designation = "La désignation est requise";
    if (!categorie || !categorie.trim()) errors.categorie = "La catégorie est requise";
    if (!unite || !unite.trim()) errors.unite = "L'unité est requise";
    if (prixAchatRef == null || isNaN(Number(prixAchatRef))) errors.prixAchatRef = "Le prix d'achat est requis";
    if (prixVenteRef == null || isNaN(Number(prixVenteRef))) errors.prixVenteRef = "Le prix de vente est requis";
    if (stockInitial == null || isNaN(Number(stockInitial))) errors.stockInitial = "Le stock initial est requis";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validation échouée", errors }, { status: 400 });
    }

    const existing = await prisma.produit.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({
        error: "Code déjà utilisé",
        errors: { code: "Ce code produit existe déjà" },
      }, { status: 409 });
    }

    const prixAchat = parseFloat(prixAchatRef);
    const prixVente = parseFloat(prixVenteRef);
    const stockInit = parseInt(stockInitial) || 0;
    const min = parseInt(stockMin) || 0;

    const produit = await prisma.produit.create({
      data: { code, designation, categorie, unite, prixAchatRef: prixAchat, prixVenteRef: prixVente, stockInitial: stockInit, stockMin: min },
    });

    await prisma.stock.create({
      data: {
        produitId: produit.id,
        stockInitial: stockInit,
        stockActuel: stockInit,
        statutStock: stockInit <= min ? "Alerte" : "OK",
        valeurAchat: prixAchat * stockInit,
        valeurVente: prixVente * stockInit,
        margePotentielle: (prixVente - prixAchat) * stockInit,
      },
    });

    return NextResponse.json({ produit }, { status: 201 });
  } catch (err) {
    console.error("Produits POST error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
