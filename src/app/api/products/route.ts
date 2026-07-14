import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { designation: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) {
      where.category = category;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { stock: true },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Products GET error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, designation, category, unit, purchaseRefPrice, saleRefPrice, initialStock, minStock } = body;

    const errors: Record<string, string> = {};
    if (!code || !code.trim()) errors.code = "Le code est requis";
    if (!designation || !designation.trim()) errors.designation = "La désignation est requise";
    if (!category || !category.trim()) errors.category = "La catégorie est requise";
    if (!unit || !unit.trim()) errors.unit = "L'unité est requise";
    if (purchaseRefPrice == null || isNaN(Number(purchaseRefPrice))) errors.purchaseRefPrice = "Le prix d'achat est requis";
    if (saleRefPrice == null || isNaN(Number(saleRefPrice))) errors.saleRefPrice = "Le prix de vente est requis";
    if (initialStock == null || isNaN(Number(initialStock))) errors.initialStock = "Le stock initial est requis";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validation échouée", errors }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({
        error: "Code déjà utilisé",
        errors: { code: "Ce code produit existe déjà" },
      }, { status: 409 });
    }

    const purchasePrice = parseFloat(purchaseRefPrice);
    const salePrice = parseFloat(saleRefPrice);
    const stock = parseInt(initialStock) || 0;
    const min = parseInt(minStock) || 0;

    const product = await prisma.product.create({
      data: { code, designation, category, unit, purchaseRefPrice: purchasePrice, saleRefPrice: salePrice, initialStock: stock, minStock: min },
    });

    await prisma.stock.create({
      data: {
        productId: product.id,
        initialStock: stock,
        currentStock: stock,
        stockStatus: stock <= min ? "Alerte" : "OK",
        costValue: purchasePrice * stock,
        saleValue: salePrice * stock,
        potentialMargin: (salePrice - purchasePrice) * stock,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error("Products POST error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
