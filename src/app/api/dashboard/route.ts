import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const months: { label: string; index: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ label: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }), index: d.getMonth() + d.getFullYear() * 12 });
    }

    const [
      produits, stocks, achats, ventes, clients, fournisseurs,
      toutesVentes, tousAchats,
      ventesCeMois, ventesMoisDernier,
      achatsCeMois, achatsMoisDernier,
      achatsAnnee, ventesAnnee,
    ] = await Promise.all([
      prisma.produit.count(),
      prisma.stock.findMany({ include: { produit: { select: { code: true, designation: true } } } }),
      prisma.achat.findMany({ take: 5, orderBy: { date: "desc" }, include: { produit: { select: { code: true, designation: true } }, fournisseur: { select: { nom: true } } } }),
      prisma.vente.findMany({ take: 5, orderBy: { date: "desc" }, include: { produit: { select: { code: true, designation: true } }, client: { select: { nom: true } } } }),
      prisma.client.count(),
      prisma.fournisseur.count(),
      prisma.vente.aggregate({ _sum: { montantTotal: true } }),
      prisma.achat.aggregate({ _sum: { montantTotal: true } }),
      prisma.vente.aggregate({ _sum: { montantTotal: true }, where: { date: { gte: firstDayThisMonth } } }),
      prisma.vente.aggregate({ _sum: { montantTotal: true }, where: { date: { gte: firstDayLastMonth, lt: firstDayThisMonth } } }),
      prisma.achat.aggregate({ _sum: { montantTotal: true }, where: { date: { gte: firstDayThisMonth } } }),
      prisma.achat.aggregate({ _sum: { montantTotal: true }, where: { date: { gte: firstDayLastMonth, lt: firstDayThisMonth } } }),
      prisma.achat.findMany({ where: { date: { gte: twelveMonthsAgo } }, select: { date: true, montantTotal: true } }),
      prisma.vente.findMany({ where: { date: { gte: twelveMonthsAgo } }, select: { date: true, montantTotal: true } }),
    ]);

    const achatMap: Record<number, number> = {};
    const venteMap: Record<number, number> = {};
    achatsAnnee.forEach(a => { const k = a.date.getMonth() + a.date.getFullYear() * 12; achatMap[k] = (achatMap[k] || 0) + Number(a.montantTotal); });
    ventesAnnee.forEach(v => { const k = v.date.getMonth() + v.date.getFullYear() * 12; venteMap[k] = (venteMap[k] || 0) + Number(v.montantTotal); });

    const evolutionMensuelle = months.map(m => ({
      mois: m.label,
      achats: achatMap[m.index] || 0,
      ventes: venteMap[m.index] || 0,
    }));

    const stockTotal = stocks.reduce((sum, s) => sum + s.stockActuel, 0);
    const stockAlerte = stocks.filter(s => s.statutStock === "Alerte").length;
    const valeurTotale = stocks.reduce((sum, s) => sum + Number(s.valeurAchat), 0);
    const margeTotale = stocks.reduce((sum, s) => sum + Number(s.margePotentielle), 0);

    const repartitionStock = {
      ok: stocks.filter(s => s.statutStock === "OK").length,
      alerte: stockAlerte,
    };

    const topProduits = stocks
      .filter(s => s.stockActuel > 0)
      .sort((a, b) => Number(b.valeurAchat) - Number(a.valeurAchat))
      .slice(0, 5)
      .map(s => ({
        code: s.produit.code,
        designation: s.produit.designation,
        stockActuel: s.stockActuel,
        valeurAchat: Number(s.valeurAchat),
      }));

    return NextResponse.json({
      totalProduits: produits,
      stockTotal,
      stockAlerte,
      valeurTotale,
      margeTotale,
      totalClients: clients,
      totalFournisseurs: fournisseurs,
      totalVentesMontant: Number(toutesVentes._sum.montantTotal || 0),
      totalAchatsMontant: Number(tousAchats._sum.montantTotal || 0),
      ventesCeMois: Number(ventesCeMois._sum.montantTotal || 0),
      ventesMoisDernier: Number(ventesMoisDernier._sum.montantTotal || 0),
      achatsCeMois: Number(achatsCeMois._sum.montantTotal || 0),
      achatsMoisDernier: Number(achatsMoisDernier._sum.montantTotal || 0),
      repartitionStock,
      topProduits,
      achatsRecents: achats,
      ventesRecentes: ventes,
      evolutionMensuelle,
    });
  } catch (err) {
    console.error("Dashboard GET error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
