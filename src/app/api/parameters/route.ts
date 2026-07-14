import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const parameters = await prisma.parameter.findMany({ orderBy: { key: "asc" } });
    return NextResponse.json({ parameters });
  } catch (err) {
    console.error("Parameters GET error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || !key.trim()) {
      return NextResponse.json({ error: "La clé est requise" }, { status: 400 });
    }

    const parameter = await prisma.parameter.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return NextResponse.json({ parameter }, { status: 201 });
  } catch (err) {
    console.error("Parameters POST error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
