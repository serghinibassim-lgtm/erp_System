import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      include: {
        ventes: {
          select: {
            montantTotal: true,
            modePaiement: true,
            date: true,
          },
          orderBy: { date: "desc" },
        },
      },
      orderBy: { nom: "asc" },
    });

    const fournisseurs = await prisma.fournisseur.findMany({
      include: {
        achats: {
          select: {
            montantTotal: true,
            modePaiement: true,
            date: true,
          },
          orderBy: { date: "desc" },
        },
      },
      orderBy: { nom: "asc" },
    });

    const creditClients = clients
      .map((c) => {
        const creditVentes = c.ventes.filter(
          (v) =>
            v.modePaiement &&
            /cr[eé]dit|non.*pay[eé]|impay[eé]|non.*r[eé]gl|dette/i.test(v.modePaiement)
        );
        const totalCredit = creditVentes.reduce(
          (sum, v) => sum + Number(v.montantTotal),
          0
        );
        return {
          id: c.id,
          code: c.code,
          nom: c.nom,
          telephone: c.telephone,
          adresse: c.adresse,
          totalCredit,
          nombreVentes: creditVentes.length,
        };
      })
      .filter((c) => c.totalCredit > 0);

    const creditFournisseurs = fournisseurs
      .map((f) => {
        const creditAchats = f.achats.filter(
          (a) =>
            a.modePaiement &&
            /cr[eé]dit|non.*pay[eé]|impay[eé]|non.*r[eé]gl|dette/i.test(a.modePaiement)
        );
        const totalDu = creditAchats.reduce(
          (sum, a) => sum + Number(a.montantTotal),
          0
        );
        return {
          id: f.id,
          code: f.code,
          nom: f.nom,
          telephone: f.telephone,
          adresse: f.adresse,
          ice: f.ice,
          totalDu,
          nombreAchats: creditAchats.length,
        };
      })
      .filter((f) => f.totalDu > 0);

    return NextResponse.json({
      success: true,
      clients: creditClients,
      fournisseurs: creditFournisseurs,
    });
  } catch (err) {
    console.error("Recouvrement error:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}