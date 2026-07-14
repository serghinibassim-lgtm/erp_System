import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      take: limit,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ suppliers });
  } catch (err) {
    console.error("Suppliers GET error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, phone, address, ice } = body;

    if (!code || !code.trim()) {
      return NextResponse.json({ error: "Le code est requis", errors: { code: "Requis" } }, { status: 400 });
    }
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Le nom est requis", errors: { name: "Requis" } }, { status: 400 });
    }

    const existing = await prisma.supplier.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "Code déjà utilisé", errors: { code: "Ce code existe déjà" } }, { status: 409 });
    }

    const supplier = await prisma.supplier.create({
      data: { code, name, phone: phone || null, address: address || null, ice: ice || null },
    });

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (err) {
    console.error("Suppliers POST error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
