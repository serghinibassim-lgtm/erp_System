import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stock: true,
        priceHistory: { orderBy: { changedAt: "desc" } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (err) {
    console.error("Product GET error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    const errors: Record<string, string> = {};
    if (body.code !== undefined && !body.code.trim()) errors.code = "Le code est requis";
    if (body.designation !== undefined && !body.designation.trim()) errors.designation = "La désignation est requise";
    if (body.category !== undefined && !body.category.trim()) errors.category = "La catégorie est requise";
    if (body.unit !== undefined && !body.unit.trim()) errors.unit = "L'unité est requise";
    if (body.purchaseRefPrice !== undefined && isNaN(Number(body.purchaseRefPrice))) errors.purchaseRefPrice = "Prix d'achat invalide";
    if (body.saleRefPrice !== undefined && isNaN(Number(body.saleRefPrice))) errors.saleRefPrice = "Prix de vente invalide";
    if (body.initialStock !== undefined && isNaN(Number(body.initialStock))) errors.initialStock = "Stock initial invalide";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validation échouée", errors }, { status: 400 });
    }

    if (body.code && body.code !== existing.code) {
      const duplicate = await prisma.product.findUnique({ where: { code: body.code } });
      if (duplicate) {
        return NextResponse.json({
          error: "Code déjà utilisé",
          errors: { code: "Ce code produit existe déjà" },
        }, { status: 409 });
      }
    }

    const oldPurchasePrice = existing.purchaseRefPrice;
    const oldSalePrice = existing.saleRefPrice;
    const newPurchasePrice = body.purchaseRefPrice !== undefined ? parseFloat(body.purchaseRefPrice) : oldPurchasePrice;
    const newSalePrice = body.saleRefPrice !== undefined ? parseFloat(body.saleRefPrice) : oldSalePrice;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(body.code !== undefined && { code: body.code }),
        ...(body.designation !== undefined && { designation: body.designation }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.purchaseRefPrice !== undefined && { purchaseRefPrice: newPurchasePrice }),
        ...(body.saleRefPrice !== undefined && { saleRefPrice: newSalePrice }),
        ...(body.initialStock !== undefined && { initialStock: parseInt(body.initialStock) || 0 }),
        ...(body.minStock !== undefined && { minStock: parseInt(body.minStock) || 0 }),
      },
    });

    if (oldPurchasePrice !== newPurchasePrice || oldSalePrice !== newSalePrice) {
      await prisma.priceHistory.create({
        data: {
          productId: id,
          oldPurchasePrice: oldPurchasePrice !== newPurchasePrice ? oldPurchasePrice : null,
          newPurchasePrice: oldPurchasePrice !== newPurchasePrice ? newPurchasePrice : null,
          oldSalePrice: oldSalePrice !== newSalePrice ? oldSalePrice : null,
          newSalePrice: oldSalePrice !== newSalePrice ? newSalePrice : null,
          reason: body.priceReason || null,
        },
      });
    }

    return NextResponse.json({ product });
  } catch (err) {
    console.error("Product PATCH error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
