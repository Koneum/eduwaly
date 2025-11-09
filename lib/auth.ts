import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import prisma from './prisma'

// Configuration de l'URL de base pour l'authentification
// Better Auth cherche automatiquement BETTER_AUTH_URL
const getBaseURL = () => {
  let baseURL: string
  
  // 1. BETTER_AUTH_URL (recommandé - domaine de production)
  if (process.env.BETTER_AUTH_URL) {
    baseURL = process.env.BETTER_AUTH_URL
    console.log('🔧 [AUTH] Using BETTER_AUTH_URL:', baseURL)
  }
  // 2. VERCEL_URL (pour preview deployments)
  // IMPORTANT: Fonctionne UNIQUEMENT si vous accédez via l'URL de preview
  else if (process.env.VERCEL_URL) {
    baseURL = `https://${process.env.VERCEL_URL}`
    console.log('⚠️ [AUTH] Using VERCEL_URL:', baseURL)
    console.log('⚠️ [AUTH] Preview deployment détecté!')
    console.log('⚠️ [AUTH] Accédez via', baseURL, 'pour que les cookies fonctionnent')
    console.log('⚠️ [AUTH] OU définissez BETTER_AUTH_URL=https://eduwaly.vercel.app pour production')
  }
  // 3. Développement local
  else {
    baseURL = 'http://localhost:3000'
    console.log('🔧 [AUTH] Using localhost:', baseURL)
  }
  
  return baseURL
}

console.log('🔧 [AUTH CONFIG] Initializing Better Auth with baseURL:', getBaseURL())
console.log('🔧 [AUTH CONFIG] basePath:', '/api/auth')

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