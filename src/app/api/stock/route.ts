import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.product = {
        OR: [
          { code: { contains: search, mode: "insensitive" } },
          { designation: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const stocks = await prisma.stock.findMany({
      where,
      orderBy: { product: { code: "asc" } },
      include: {
        product: { select: { code: true, designation: true, unit: true, minStock: true } },
      },
    });

    return NextResponse.json({ stocks });
  } catch (err) {
    console.error("Stock GET error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
