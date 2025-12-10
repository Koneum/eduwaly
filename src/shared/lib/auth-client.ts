import { createAuthClient } from 'better-auth/react'

// Configuration de l'URL de base pour le client
const getClientBaseURL = () => {
  // En production Vercel
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  // Variable d'environnement personnalisée
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  // Fallback pour Vercel
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }
  // Développement local
  return 'http://localhost:3000'
}

export const authClient = createAuthClient({
    baseURL: getClientBaseURL(),
    basePath: '/api/auth',
})

export const { signIn, signUp, signOut, useSession } = authClient
