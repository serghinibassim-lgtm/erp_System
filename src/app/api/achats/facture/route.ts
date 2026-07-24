import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doc = searchParams.get("doc");
    if (!doc) {
      return NextResponse.json({ error: "Paramètre 'doc' requis" }, { status: 400 });
    }

    const achats = await prisma.achat.findMany({
      where: { numeroDocument: doc },
      include: {
        produit: { select: { code: true, designation: true, unite: true } },
        fournisseur: { select: { nom: true, telephone: true, adresse: true, ice: true } },
      },
      orderBy: { date: "desc" },
    });

    if (achats.length === 0) {
      return NextResponse.json({ error: "Aucun achat trouvé pour ce document" }, { status: 404 });
    }

    const total = achats.reduce((sum, a) => sum + Number(a.montantTotal), 0);

    return NextResponse.json({
      success: true,
      document: {
        numeroDocument: doc,
        date: achats[0].date,
        fournisseur: achats[0].fournisseur,
        modePaiement: achats[0].modePaiement,
        observation: achats[0].observation,
      },
      items: achats.map(a => ({
        id: a.id,
        produit: a.produit,
        quantite: a.quantite,
        prixUnitaire: Number(a.prixUnitaire),
        montantTotal: Number(a.montantTotal),
      })),
      total,
    });
  } catch (err) {
    console.error("Facture achats error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}