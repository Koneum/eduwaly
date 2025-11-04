import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'https://eduwaly.vercel.app',
  basePath: '/api/auth',
})

export const { signIn, signUp, signOut, useSession } = authClient
