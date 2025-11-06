import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import prisma from './prisma'

// Configuration de l'URL de base pour l'authentification
// Better Auth cherche automatiquement BETTER_AUTH_URL
const getBaseURL = () => {
  // 1. BETTER_AUTH_URL (recommandé par Better Auth)
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL
  }
  // 2. Variable d'environnement personnalisée
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  // 3. En production Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  // 4. Développement local
  return 'http://localhost:3000'
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