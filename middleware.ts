import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Middleware simplifié pour Vercel Edge Runtime
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  console.log('🔒 [MIDDLEWARE] Chemin:', path)

  // Routes publiques - toujours accessibles
  const publicRoutes = ["/login", "/register", "/unauthorized", "/enroll", "/pricing", "/api"]
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route))

  if (isPublicRoute) {
    console.log('✅ [MIDDLEWARE] Route publique, accès autorisé')
    return NextResponse.next()
  }

  // Vérifier si l'utilisateur a un cookie de session
  const sessionToken = request.cookies.get("schooly.session_token")?.value
  
  console.log('🍪 [MIDDLEWARE] Cookie session:', sessionToken ? 'PRÉSENT' : 'ABSENT')

  // Pas de session -> redirection vers login
  if (!sessionToken) {
    console.log('❌ [MIDDLEWARE] Pas de session, redirection vers /login')
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Si session présente, laisser passer
  console.log('✅ [MIDDLEWARE] Session présente, accès autorisé')
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - login, register, unauthorized (public auth pages)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login|register|unauthorized|enroll|pricing).*)",
  ],
}
