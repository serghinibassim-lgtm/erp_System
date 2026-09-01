import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [achats, ventes] = await Promise.all([
      prisma.achat.findMany({
        where: { alerte: true },
        orderBy: { date: "desc" },
        take: 100,
        include: {
          produit: { select: { code: true, designation: true, prixAchatRef: true } },
          fournisseur: { select: { nom: true } },
        },
      }),
      prisma.vente.findMany({
        where: { alerte: true },
        orderBy: { date: "desc" },
        take: 100,
        include: {
          produit: { select: { code: true, designation: true, prixVenteRef: true } },
          client: { select: { nom: true } },
        },
      }),
    ]);

    const dataAchats = achats.map((a) => ({
      id: a.id,
      type: "achat",
      date: a.date,
      produit: a.produit,
      contrepartie: a.fournisseur?.nom || null,
      prixUnitaire: Number(a.prixUnitaire),
      prixRef: Number(a.produit.prixAchatRef),
      ecart: a.ecart != null ? Number(a.ecart) : Number(a.prixUnitaire) - Number(a.produit.prixAchatRef),
    }));

    const dataVentes = ventes.map((v) => ({
      id: v.id,
      type: "vente",
      date: v.date,
      produit: v.produit,
      contrepartie: v.client?.nom || null,
      prixUnitaire: Number(v.prixUnitaire),
      prixRef: Number(v.produit.prixVenteRef),
      ecart: v.ecart != null ? Number(v.ecart) : Number(v.produit.prixVenteRef) - Number(v.prixUnitaire),
    }));

    return NextResponse.json({
      total: dataAchats.length + dataVentes.length,
      ventes: dataVentes,
      achats: dataAchats,
    });
  } catch (err) {
    console.error("Alertes prix GET error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}