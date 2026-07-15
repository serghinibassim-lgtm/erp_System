import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    const errors: Record<string, string> = {};
    if (!name || !name.trim()) errors.name = "Le nom est requis";
    if (!email || !email.trim()) errors.email = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Email invalide";
    if (!password) errors.password = "Le mot de passe est requis";
    else if (password.length < 6) errors.password = "Minimum 6 caractères";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validation échouée", errors }, { status: 400 });
    }

    const existing = await prisma.utilisateur.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({
        error: "Email déjà utilisé",
        errors: { email: "Cet email est déjà utilisé" },
      }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.utilisateur.create({
      data: { nom: name, email, motDePasse: hashedPassword },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    const response = NextResponse.json({
      user: { id: user.id, name: user.nom, email: user.email, role: user.role },
      token,
    }, { status: 201 });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
