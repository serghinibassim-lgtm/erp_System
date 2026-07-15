import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const payload = verifyToken(token);
    const user = await prisma.utilisateur.findUnique({
      where: { id: payload.userId },
      select: { id: true, nom: true, email: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Remap nom to name for frontend compatibility if needed
    return NextResponse.json({ user: { ...user, name: user.nom } });
  } catch {
    return NextResponse.json({ user: null });
  }
}
