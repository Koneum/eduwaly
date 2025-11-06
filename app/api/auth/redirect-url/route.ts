import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import { headers } from 'next/headers'

/**
 * API pour obtenir l'URL de redirection appropriée selon le rôle de l'utilisateur
 * Utilisé après le login pour rediriger côté client
 */
export async function GET() {
  try {
    await headers() // Nécessaire pour Next.js
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ redirectUrl: '/login' })
    }

    const { role, schoolId } = user
    let redirectUrl = '/'

    switch (role) {
      case 'SUPER_ADMIN':
        redirectUrl = '/super-admin'
        break
      case 'SCHOOL_ADMIN':
      case 'MANAGER':
      case 'PERSONNEL':
      case 'ASSISTANT':
      case 'SECRETARY':
        redirectUrl = `/admin/${schoolId}`
        break
      case 'TEACHER':
        redirectUrl = `/teacher/${schoolId}`
        break
      case 'STUDENT':
        redirectUrl = `/student/${schoolId}`
        break
      case 'PARENT':
        redirectUrl = `/parent/${schoolId}`
        break
      default:
        redirectUrl = '/unauthorized'
    }

    return NextResponse.json({ redirectUrl })
  } catch (error) {
    console.error('Error getting redirect URL:', error)
    return NextResponse.json({ redirectUrl: '/login' }, { status: 500 })
  }
}
