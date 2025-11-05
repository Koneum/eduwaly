import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
    baseURL: process.env.NODE_ENV === 'production' 
      ? 'https://eduwaly.vercel.app' 
      : 'http://localhost:3000',
    basePath: '/api/auth',
})

export const { signIn, signUp, signOut, useSession } = authClient
