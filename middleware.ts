// MIDDLEWARE DÉSACTIVÉ POUR TEST
// Toutes les redirections sont gérées côté serveur (Server Components)

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(_request: NextRequest) {
  console.log('🚫 [MIDDLEWARE] DÉSACTIVÉ - Pas de vérification')
  // Laisser passer toutes les requêtes
  return NextResponse.next()
}

// Matcher vide = middleware ne s'exécute jamais
export const config = {
  matcher: [],
}
