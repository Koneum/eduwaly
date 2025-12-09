import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * API de diagnostic pour débugger les problèmes d'authentification
 * Accessible via GET /api/debug/auth
 * À SUPPRIMER EN PRODUCTION après debug
 */
export async function GET() {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ? '✅ SET' : '❌ NOT SET',
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ? '✅ SET (hidden)' : '❌ NOT SET',
      DATABASE_URL: process.env.DATABASE_URL ? '✅ SET (hidden)' : '❌ NOT SET',
      VERCEL_URL: process.env.VERCEL_URL || 'NOT SET',
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'NOT SET',
      NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL || 'NOT SET',
    },
    auth: {
      baseURL: process.env.BETTER_AUTH_URL || 
               (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
      secureCoookies: process.env.NODE_ENV === 'production',
      cookiePrefix: 'schooly',
    },
    trustedOrigins: [
      'http://localhost:3000',
      'https://eduwaly.vercel.app',
      'https://www.educwaly.com',
      'https://master.d32jdsavkxaqiy.amplifyapp.com',
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    ].filter(Boolean),
    recommendations: [] as string[],
  }

  // Vérifications et recommandations
  if (!process.env.BETTER_AUTH_URL) {
    debugInfo.recommendations.push(
      '⚠️ BETTER_AUTH_URL non défini. Ajoutez-le dans Vercel: Settings > Environment Variables'
    )
  }
  
  if (!process.env.BETTER_AUTH_SECRET) {
    debugInfo.recommendations.push(
      '⚠️ BETTER_AUTH_SECRET non défini. Générez-en un avec: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    )
  }

  if (!process.env.DATABASE_URL) {
    debugInfo.recommendations.push(
      '⚠️ DATABASE_URL non défini. Connectez votre base de données PostgreSQL'
    )
  }

  if (process.env.VERCEL_URL && !process.env.BETTER_AUTH_URL) {
    debugInfo.recommendations.push(
      `💡 Définissez BETTER_AUTH_URL=https://${process.env.VERCEL_URL} pour la production`
    )
  }

  return NextResponse.json(debugInfo, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
