import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const parametres = await prisma.parametre.findMany({ orderBy: { cle: "asc" } });
    return NextResponse.json({ parametres });
  } catch (err) {
    console.error("Parametres GET error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cle, valeur } = body;

    if (!cle || !cle.trim()) {
      return NextResponse.json({ error: "La clé est requise" }, { status: 400 });
    }

    const parametre = await prisma.parametre.upsert({
      where: { cle },
      update: { valeur },
      create: { cle, valeur },
    });

    return NextResponse.json({ parametre }, { status: 201 });
  } catch (err) {
    console.error("Parametres POST error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
