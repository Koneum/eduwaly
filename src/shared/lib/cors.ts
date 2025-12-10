import { NextResponse } from "next/server"

/**
 * Configuration CORS pour les webhooks et API externes
 * Selon doc Next.js: https://nextjs.org/docs/app/api-reference/file-conventions/route
 */

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

/**
 * Gérer les requêtes OPTIONS (preflight CORS)
 */
export function handleCorsOptions() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}

/**
 * Ajouter les headers CORS à une réponse
 */
export function withCors(response: NextResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

/**
 * Créer une réponse JSON avec CORS
 */
export function corsJsonResponse(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...corsHeaders,
      ...init?.headers,
    },
  })
}
