import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const produit = await prisma.produit.findUnique({
      where: { id },
      include: {
        stock: true,
        historiquePrix: { orderBy: { dateModification: "desc" } },
      },
    });

    if (!produit) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    return NextResponse.json({ produit });
  } catch (err) {
    console.error("Produit GET error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireRole(request, ["RESPONSABLE"]);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.produit.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    const errors: Record<string, string> = {};
    if (body.code !== undefined && !body.code.trim()) errors.code = "Le code est requis";
    if (body.designation !== undefined && !body.designation.trim()) errors.designation = "La désignation est requise";
    if (body.categorie !== undefined && !body.categorie.trim()) errors.categorie = "La catégorie est requise";
    if (body.unite !== undefined && !body.unite.trim()) errors.unite = "L'unité est requise";
    if (body.prixAchatRef !== undefined && isNaN(Number(body.prixAchatRef))) errors.prixAchatRef = "Prix d'achat invalide";
    if (body.prixVenteRef !== undefined && isNaN(Number(body.prixVenteRef))) errors.prixVenteRef = "Prix de vente invalide";
    if (body.stockInitial !== undefined && isNaN(Number(body.stockInitial))) errors.stockInitial = "Stock initial invalide";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validation échouée", errors }, { status: 400 });
    }

    if (body.code && body.code !== existing.code) {
      const duplicate = await prisma.produit.findUnique({ where: { code: body.code } });
      if (duplicate) {
        return NextResponse.json({
          error: "Code déjà utilisé",
          errors: { code: "Ce code produit existe déjà" },
        }, { status: 409 });
      }
    }

    const ancienPrixAchat = existing.prixAchatRef;
    const ancienPrixVente = existing.prixVenteRef;
    const nouveauPrixAchat = body.prixAchatRef !== undefined ? parseFloat(body.prixAchatRef) : ancienPrixAchat;
    const nouveauPrixVente = body.prixVenteRef !== undefined ? parseFloat(body.prixVenteRef) : ancienPrixVente;

    const produit = await prisma.produit.update({
      where: { id },
      data: {
        ...(body.code !== undefined && { code: body.code }),
        ...(body.designation !== undefined && { designation: body.designation }),
        ...(body.categorie !== undefined && { categorie: body.categorie }),
        ...(body.unite !== undefined && { unite: body.unite }),
        ...(body.prixAchatRef !== undefined && { prixAchatRef: nouveauPrixAchat }),
        ...(body.prixVenteRef !== undefined && { prixVenteRef: nouveauPrixVente }),
        ...(body.stockInitial !== undefined && { stockInitial: parseInt(body.stockInitial) || 0 }),
        ...(body.stockMin !== undefined && { stockMin: parseInt(body.stockMin) || 0 }),
      },
    });

    if (ancienPrixAchat !== nouveauPrixAchat || ancienPrixVente !== nouveauPrixVente) {
      await prisma.historiquePrix.create({
        data: {
          produitId: id,
          ancienPrixAchat: ancienPrixAchat !== nouveauPrixAchat ? ancienPrixAchat : null,
          nouveauPrixAchat: ancienPrixAchat !== nouveauPrixAchat ? nouveauPrixAchat : null,
          ancienPrixVente: ancienPrixVente !== nouveauPrixVente ? ancienPrixVente : null,
          nouveauPrixVente: ancienPrixVente !== nouveauPrixVente ? nouveauPrixVente : null,
          raison: body.raisonPrix || null,
        },
      });
    }

    return NextResponse.json({ produit });
  } catch (err) {
    console.error("Produit PATCH error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
