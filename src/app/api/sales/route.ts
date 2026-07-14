import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    const search = searchParams.get("search") || "";
    if (search) {
      where.product = {
        OR: [
          { code: { contains: search, mode: "insensitive" } },
          { designation: { contains: search, mode: "insensitive" } },
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

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
        include: {
          product: { select: { code: true, designation: true } },
          client: { select: { name: true } },
        },
      }),
      prisma.sale.count({ where }),
    ]);

    return NextResponse.json({
      sales,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Sales GET error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, saleNumber, clientId, productId, quantity, unitPrice, totalAmount, paymentMethod, observation } = body;

    const errors: Record<string, string> = {};
    if (!productId) errors.productId = "Le produit est requis";
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) errors.quantity = "La quantité doit être > 0";
    if (unitPrice == null || isNaN(Number(unitPrice))) errors.unitPrice = "Le prix unitaire est requis";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validation échouée", errors }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { stock: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    const currentStock = product.stock?.currentStock ?? 0;
    if (quantity > currentStock) {
      return NextResponse.json({
        error: "Stock insuffisant",
        errors: { quantity: `Stock disponible: ${currentStock}` },
      }, { status: 400 });
    }

    const qty = parseInt(quantity);
    const price = parseFloat(unitPrice);
    const total = totalAmount != null ? parseFloat(totalAmount) : qty * price;

    const deviation = price < Number(product.saleRefPrice)
      ? Number(product.saleRefPrice) - price
      : null;

    const thresholdParam = await prisma.parameter.findUnique({ where: { key: "sale_alert_threshold" } });
    const threshold = thresholdParam ? parseFloat(thresholdParam.value) : 0;
    const alert = deviation != null && deviation > threshold;

    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          date: date ? new Date(date) : new Date(),
          saleNumber: saleNumber || null,
          clientId: clientId || null,
          productId,
          quantity: qty,
          unitPrice: price,
          totalAmount: total,
          paymentMethod: paymentMethod || null,
          observation: observation || null,
          deviation: deviation || null,
          alert,
        },
      });

      const stock = await tx.stock.findUnique({ where: { productId } });
      if (stock) {
        const newTotalSales = stock.totalSales + qty;
        const newCurrentStock = stock.initialStock + stock.totalPurchases - newTotalSales;
        const newCostValue = Number(product.purchaseRefPrice) * newCurrentStock;
        const newSaleValue = Number(product.saleRefPrice) * newCurrentStock;
        const newPotentialMargin = newSaleValue - newCostValue;

        await tx.stock.update({
          where: { productId },
          data: {
            totalSales: newTotalSales,
            currentStock: newCurrentStock,
            stockStatus: newCurrentStock <= product.minStock ? "Alerte" : "OK",
            costValue: newCostValue,
            saleValue: newSaleValue,
            potentialMargin: newPotentialMargin,
          },
        });
      }

      return newSale;
    });

    return NextResponse.json({ sale }, { status: 201 });
  } catch (err) {
    console.error("Sales POST error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
