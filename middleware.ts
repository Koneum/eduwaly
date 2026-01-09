import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * 🔒 Middleware de Sécurité Global - Schooly
 * 
 * Basé sur:
 * - Next.js Data Security Guide: https://nextjs.org/docs/app/guides/data-security
 * - OWASP Top 10
 * - Rapport d'audit sissansissan
 * 
 * Routes autorisées sans authentification:
 * - /api/auth/* (Better Auth)
 * - /login, /register, /enroll, /pricing (pages publiques)
 * - GET /api/public/* (routes publiques en lecture)
 * 
 * Routes protégées:
 * - /admin/* (interface admin - toutes les écoles)
 * - /super-admin/* (super admin uniquement)
 * - /student/* (portail étudiant)
 * - /parent/* (portail parent)
 * - /teacher/* (portail enseignant)
 * - /api/* mutations (POST, PUT, PATCH, DELETE)
 */

// Helper pour récupérer le token de session
function getSessionToken(request: NextRequest): string | undefined {
  // En production avec HTTPS, le cookie a le préfixe __Secure-
  return request.cookies.get('__Secure-schooly.session_token')?.value 
    || request.cookies.get('schooly.session_token')?.value
}

// Routes qui ne nécessitent JAMAIS d'authentification
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/enroll',
  '/pricing',
  '/unauthorized',
  '/forgot-password',
  '/reset-password',
]

// Routes API publiques (toujours accessibles)
const PUBLIC_API_ROUTES = [
  '/api/auth',           // Better Auth - TOUJOURS public
  '/api/enroll',         // Inscription étudiants/parents
  '/api/public',         // Routes publiques explicites
  '/api/payments/callback',  // VitePay callback (serveur-à-serveur)
  '/api/vitepay/webhook',    // VitePay webhook (serveur-à-serveur)
]

// Routes API publiques en lecture seule (GET uniquement)
const PUBLIC_GET_API_ROUTES = [
  '/api/plans',          // Liste des plans d'abonnement
  '/api/pricing',        // Tarifs
]

// Routes protégées par rôle (vérification cookie de session)
const PROTECTED_ROUTES = [
  '/admin',
  '/super-admin',
  '/student',
  '/parent',
  '/teacher',
  '/dashboard',
]

// Routes API admin (nécessitent authentification)
const ADMIN_API_ROUTES = [
  '/api/admin',
  '/api/super-admin',
  '/api/school-admin',
  '/api/dashboard',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  // ====================================================
  // 0. Gérer les requêtes OPTIONS (CORS preflight)
  // ====================================================
  if (method === 'OPTIONS') {
    const origin = request.headers.get('origin') || ''
    const allowedOrigins = [
      'https://educwaly.com',
      'https://www.educwaly.com',
      'https://eduwaly.vercel.app',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]
    
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
    
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  // ====================================================
  // 1. Ajouter les headers de sécurité à TOUTES les réponses
  // ====================================================
  const response = NextResponse.next()
  
  // Headers de sécurité (OWASP recommandations)
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // CSP basique (à personnaliser selon les besoins)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https:;"
  )

  // ====================================================
  // 2. Routes publiques - toujours accessibles
  // ====================================================
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return response
  }

  // ====================================================
  // 3. Routes API publiques - toujours accessibles
  // ====================================================
  for (const route of PUBLIC_API_ROUTES) {
    if (pathname.startsWith(route)) {
      return response
    }
  }

  // ====================================================
  // 4. Routes API publiques en lecture (GET uniquement)
  // ====================================================
  if (method === 'GET') {
    for (const route of PUBLIC_GET_API_ROUTES) {
      if (pathname.startsWith(route)) {
        return response
      }
    }
  }

  // ====================================================
  // 5. Routes protégées (pages) - vérifier le cookie de session
  // ====================================================
  for (const route of PROTECTED_ROUTES) {
    if (pathname.startsWith(route)) {
      const sessionToken = getSessionToken(request)
      
      if (!sessionToken) {
        // Rediriger vers la page de connexion avec callback
        const signInUrl = new URL('/login', request.url)
        signInUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(signInUrl)
      }
      
      // Le cookie existe, laisser passer (vérification du rôle côté page/API)
      return response
    }
  }

  // ====================================================
  // 6. Routes API admin - vérifier le cookie de session
  // ====================================================
  for (const route of ADMIN_API_ROUTES) {
    if (pathname.startsWith(route)) {
      const sessionToken = getSessionToken(request)
      
      if (!sessionToken) {
        return NextResponse.json(
          { error: 'Non authentifié', code: 'UNAUTHENTICATED' },
          { status: 401 }
        )
      }
      
      return response
    }
  }

  // ====================================================
  // 7. Routes API avec mutations (POST, PUT, PATCH, DELETE)
  // ====================================================
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    if (pathname.startsWith('/api/')) {
      const sessionToken = getSessionToken(request)
      
      // Exceptions déjà gérées plus haut (auth, enroll, public)
      if (!sessionToken) {
        return NextResponse.json(
          { error: 'Non authentifié', code: 'UNAUTHENTICATED' },
          { status: 401 }
        )
      }
    }
  }

  // ====================================================
  // 8. Routes spécifiques - students, teachers, etc.
  // ====================================================
  const SENSITIVE_API_ROUTES = [
    '/api/students',
    '/api/teachers',
    '/api/enseignants',
    '/api/parents',
    '/api/messages',
    '/api/reports',
    '/api/upload',
    '/api/documents',
  ]

  for (const route of SENSITIVE_API_ROUTES) {
    if (pathname.startsWith(route)) {
      const sessionToken = getSessionToken(request)
      
      if (!sessionToken) {
        return NextResponse.json(
          { error: 'Non authentifié', code: 'UNAUTHENTICATED' },
          { status: 401 }
        )
      }
      
      return response
    }
  }

  // ====================================================
  // 9. Laisser passer les autres requêtes (fichiers statiques, etc.)
  // ====================================================
  return response
}

// Configuration du matcher - quelles routes le middleware doit intercepter
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - Images (*.svg, *.png, *.jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
