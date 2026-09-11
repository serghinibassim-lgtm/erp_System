  import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getTokenFromRequest, verifyTokenEdge } from "@/lib/auth-edge";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    const token = await getTokenFromRequest(request);
    if (token) {
      try {
        await verifyTokenEdge(token);
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch {
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  if (
    pathname === "/" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard") || (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth"))) {
    const token = await getTokenFromRequest(request);
    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const payload = await verifyTokenEdge(token);

      // Seul RESPONSABLE peut accéder aux paramètres et à la gestion des utilisateurs
      if (pathname.startsWith("/dashboard/parametres") && payload.role !== "RESPONSABLE") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (pathname.startsWith("/dashboard/utilisateurs") && payload.role !== "RESPONSABLE") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      return NextResponse.next();
    } catch {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Token invalide" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
