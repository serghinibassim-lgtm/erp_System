import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const recherche = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (recherche) {
      where.OR = [
        { nom: { contains: recherche, mode: "insensitive" } },
        { code: { contains: recherche, mode: "insensitive" } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      take: limit,
      orderBy: { nom: "asc" },
    });

    return NextResponse.json({ clients });
  } catch (err) {
    console.error("Clients GET error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ["RESPONSABLE"]);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { code, nom, telephone, adresse } = body;

    if (!code || !code.trim()) {
      return NextResponse.json({ error: "Le code est requis", errors: { code: "Requis" } }, { status: 400 });
    }
    if (!nom || !nom.trim()) {
      return NextResponse.json({ error: "Le nom est requis", errors: { nom: "Requis" } }, { status: 400 });
    }

    const existing = await prisma.client.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "Code déjà utilisé", errors: { code: "Ce code existe déjà" } }, { status: 409 });
    }

    const client = await prisma.client.create({
      data: { code, nom, telephone: telephone || null, adresse: adresse || null },
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (err) {
    console.error("Clients POST error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
