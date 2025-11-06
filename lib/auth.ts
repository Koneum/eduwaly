import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import prisma from './prisma'

// Configuration de l'URL de base pour l'authentification
// Better Auth cherche automatiquement BETTER_AUTH_URL
const getBaseURL = () => {
  let baseURL: string
  
  // 1. BETTER_AUTH_URL (recommandé par Better Auth)
  if (process.env.BETTER_AUTH_URL) {
    baseURL = process.env.BETTER_AUTH_URL
    console.log('🔧 [AUTH] Using BETTER_AUTH_URL:', baseURL)
  }
  // 2. Variable d'environnement personnalisée
  else if (process.env.NEXT_PUBLIC_BASE_URL) {
    baseURL = process.env.NEXT_PUBLIC_BASE_URL
    console.log('🔧 [AUTH] Using NEXT_PUBLIC_BASE_URL:', baseURL)
  }
  // 3. En production Vercel
  else if (process.env.VERCEL_URL) {
    baseURL = `https://${process.env.VERCEL_URL}`
    console.log('⚠️ [AUTH] Using VERCEL_URL (preview):', baseURL)
    console.log('⚠️ [AUTH] IMPORTANT: Définissez BETTER_AUTH_URL sur Vercel!')
  }
  // 4. Développement local
  else {
    baseURL = 'http://localhost:3000'
    console.log('🔧 [AUTH] Using localhost:', baseURL)
  }
  
  return baseURL
}

export const auth = betterAuth({
  baseURL: getBaseURL(),
  basePath: '/api/auth',
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'STUDENT', 
      },
      phone: {
        type: 'string', 
        required: false,
      },
      schoolId: {
        type: 'string',
        required: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    // CRITIQUE: Secure cookies en production uniquement
    // En local (HTTP), les cookies secure ne fonctionnent pas
    useSecureCookies: process.env.NODE_ENV === 'production',
    cookiePrefix: 'schooly',
  },
  trustedOrigins: [
    'http://localhost:3000',
    'https://eduwaly.vercel.app',
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ],
})