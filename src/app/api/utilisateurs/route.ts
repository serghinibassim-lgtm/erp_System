import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, hashPassword } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ["RESPONSABLE"]);
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const [utilisateurs, total] = await Promise.all([
      prisma.utilisateur.findMany({
        select: { id: true, nom: true, email: true, role: true, creeLe: true },
        orderBy: { creeLe: "asc" },
        skip,
        take: limit,
      }),
      prisma.utilisateur.count(),
    ]);

    return NextResponse.json({
      utilisateurs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("List users error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ["RESPONSABLE"]);
  if ("error" in auth) return auth.error;

  try {
    const { nom, email, password } = await request.json();

    const errors: Record<string, string> = {};
    if (!nom || !nom.trim()) errors.nom = "Le nom est requis";
    if (!email || !email.trim()) errors.email = "L'email est requis";
    if (!password || password.length < 6) errors.password = "Le mot de passe doit contenir au moins 6 caractères";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validation échouée", errors }, { status: 400 });
    }

    const existingUser = await prisma.utilisateur.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({
        error: "Un compte avec cet email existe déjà",
        errors: { email: "Cet email est déjà utilisé" },
      }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.utilisateur.create({
      data: {
        nom: nom.trim(),
        email: email.trim().toLowerCase(),
        motDePasse: hashedPassword,
        role: "EMPLOYER",
      },
      select: { id: true, nom: true, email: true, role: true, creeLe: true },
    });

    return NextResponse.json({ utilisateur: user }, { status: 201 });
  } catch (err) {
    console.error("Create user error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
