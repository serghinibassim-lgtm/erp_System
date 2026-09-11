import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(request: Request) {
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

    const responsableExists = await prisma.utilisateur.findFirst({ where: { role: "RESPONSABLE" } });
    if (responsableExists) {
      return NextResponse.json({
        error: "Un responsable existe déjà. Connectez-vous.",
      }, { status: 403 });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.utilisateur.create({
      data: {
        nom: nom.trim(),
        email: email.trim().toLowerCase(),
        motDePasse: hashedPassword,
        role: "RESPONSABLE",
      },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    const response = NextResponse.json({
      user: { id: user.id, name: user.nom, email: user.email, role: user.role },
      token,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
