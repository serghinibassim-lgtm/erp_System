import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireRole(request, ["RESPONSABLE"]);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    if (body.code && body.code !== existing.code) {
      const duplicate = await prisma.client.findUnique({ where: { code: body.code } });
      if (duplicate) {
        return NextResponse.json({ error: "Code déjà utilisé", errors: { code: "Ce code existe déjà" } }, { status: 409 });
      }
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(body.code !== undefined && { code: body.code }),
        ...(body.nom !== undefined && { nom: body.nom }),
        ...(body.telephone !== undefined && { telephone: body.telephone || null }),
        ...(body.adresse !== undefined && { adresse: body.adresse || null }),
      },
    });

    return NextResponse.json({ client });
  } catch (err) {
    console.error("Client PATCH error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireRole(request, ["RESPONSABLE"]);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;

    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Client DELETE error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
