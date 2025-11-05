import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import prisma from './prisma'

export const auth = betterAuth({
  basePath: '/api/auth',
  debug: process.env.NODE_ENV !== 'production',
  logger: console,
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
      schoolId: {
        type: 'string',
        required: false,
      },
      avatar: {
        type: 'string',
        required: false,
      },
      isActive: {
        type: 'boolean',
        required: false,
        defaultValue: true,
      },
      lastLoginAt: {
        type: 'date',
        required: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // 1 jour
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    cookiePrefix: 'schooly',
  },
  trustedOrigins: [
    'http://localhost:3000', 
    'https://eduwaly.vercel.app',
    `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  ],
})
