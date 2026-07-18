import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireRole(request, ["RESPONSABLE"]);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.fournisseur.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Fournisseur introuvable" }, { status: 404 });
    }

    if (body.code && body.code !== existing.code) {
      const duplicate = await prisma.fournisseur.findUnique({ where: { code: body.code } });
      if (duplicate) {
        return NextResponse.json({ error: "Code déjà utilisé", errors: { code: "Ce code existe déjà" } }, { status: 409 });
      }
    }

    const fournisseur = await prisma.fournisseur.update({
      where: { id },
      data: {
        ...(body.code !== undefined && { code: body.code }),
        ...(body.nom !== undefined && { nom: body.nom }),
        ...(body.telephone !== undefined && { telephone: body.telephone || null }),
        ...(body.adresse !== undefined && { adresse: body.adresse || null }),
        ...(body.ice !== undefined && { ice: body.ice || null }),
      },
    });

    return NextResponse.json({ fournisseur });
  } catch (err) {
    console.error("Fournisseur PATCH error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireRole(request, ["RESPONSABLE"]);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;

    const existing = await prisma.fournisseur.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Fournisseur introuvable" }, { status: 404 });
    }

    await prisma.fournisseur.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Fournisseur DELETE error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
