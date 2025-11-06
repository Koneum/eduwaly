import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Middleware simplifié pour Vercel Edge Runtime
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Routes publiques - toujours accessibles
  const publicRoutes = ["/login", "/register", "/unauthorized", "/enroll", "/pricing", "/api"]
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Vérifier si l'utilisateur a un cookie de session
  const sessionToken = request.cookies.get("schooly.session_token")?.value

  // Pas de session -> redirection vers login
  if (!sessionToken && path !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Si session présente, laisser passer
  // La vérification détaillée et les redirections se feront côté serveur dans les pages
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/super-admin/:path*",
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/parent/:path*",
    "/dashboard/:path*"
  ],
}
