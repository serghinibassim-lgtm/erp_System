import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [products, stocks, purchases, sales] = await Promise.all([
      prisma.product.count(),
      prisma.stock.findMany({
        include: { product: { select: { code: true, designation: true } } },
      }),
      prisma.purchase.findMany({
        take: 5,
        orderBy: { date: "desc" },
        include: {
          product: { select: { code: true, designation: true } },
          supplier: { select: { name: true } },
        },
      }),
      prisma.sale.findMany({
        take: 5,
        orderBy: { date: "desc" },
        include: {
          product: { select: { code: true, designation: true } },
          client: { select: { name: true } },
        },
      }),
    ]);

    const totalStock = stocks.reduce((sum, s) => sum + s.currentStock, 0);
    const alertStock = stocks.filter(s => s.stockStatus === "Alerte").length;
    const totalValue = stocks.reduce((sum, s) => sum + Number(s.costValue), 0);
    const totalMargin = stocks.reduce((sum, s) => sum + Number(s.potentialMargin), 0);

    const stockStatusDist = {
      ok: stocks.filter(s => s.stockStatus === "OK").length,
      alerte: alertStock,
    };

    const topProducts = stocks
      .filter(s => s.currentStock > 0)
      .sort((a, b) => Number(b.costValue) - Number(a.costValue))
      .slice(0, 5)
      .map(s => ({
        code: s.product.code,
        designation: s.product.designation,
        currentStock: s.currentStock,
        costValue: Number(s.costValue),
      }));

    return NextResponse.json({
      totalProducts: products,
      totalStock,
      alertStock,
      totalValue,
      totalMargin,
      stockStatusDist,
      topProducts,
      recentPurchases: purchases,
      recentSales: sales,
    });
  } catch (err) {
    console.error("Dashboard GET error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
