import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doc = searchParams.get("doc");
    if (!doc) {
      return NextResponse.json({ error: "Paramètre 'doc' requis" }, { status: 400 });
    }

    const ventes = await prisma.vente.findMany({
      where: { numeroVente: doc },
      include: {
        produit: { select: { code: true, designation: true, unite: true } },
        client: { select: { nom: true, telephone: true, adresse: true } },
      },
      orderBy: { date: "desc" },
    });

    if (ventes.length === 0) {
      return NextResponse.json({ error: "Aucune vente trouvée pour ce document" }, { status: 404 });
    }

    const total = ventes.reduce((sum, v) => sum + Number(v.montantTotal), 0);

    return NextResponse.json({
      success: true,
      document: {
        numeroVente: doc,
        date: ventes[0].date,
        client: ventes[0].client,
        modePaiement: ventes[0].modePaiement,
        observation: ventes[0].observation,
      },
      items: ventes.map(v => ({
        id: v.id,
        produit: v.produit,
        quantite: v.quantite,
        prixUnitaire: Number(v.prixUnitaire),
        montantTotal: Number(v.montantTotal),
      })),
      total,
    });
  } catch (err) {
    console.error("Facture ventes error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}