import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Middleware selon les règles officielles Next.js
 * Doc: https://nextjs.org/docs/app/api-reference/file-conventions/middleware
 * 
 * - Protection des routes (vérification cookie)
 * - Routes publiques accessibles
 * - Pas de vérification sur /api (géré dans Route Handlers)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Routes publiques - toujours accessibles
  const publicRoutes = [
    "/login",
    "/register", 
    "/unauthorized",
    "/enroll",
    "/pricing",
  ]
  
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Routes protégées - vérifier cookie de session
  const sessionToken = request.cookies.get("schooly.session_token")?.value

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Session présente - laisser passer
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes - CORS géré dans Route Handlers)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - images (*.svg, *.png, *.jpg, etc.)
     * 
     * Selon doc Next.js: https://nextjs.org/docs/app/api-reference/file-conventions/middleware
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
