import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import { headers } from 'next/headers'

/**
 * API pour obtenir l'URL de redirection appropriée selon le rôle de l'utilisateur
 * Utilisé après le login pour rediriger côté client
 */
export async function GET(req: Request) {
  try {
    console.log('📍 [REDIRECT-API] Requête reçue')
    
    // Vérifier les cookies reçus
    const cookies = req.headers.get('cookie')
    console.log('🍪 [REDIRECT-API] Cookies reçus:', cookies ? 'OUI' : 'NON')
    if (cookies) {
      console.log('🍪 [REDIRECT-API] Cookie header:', cookies.substring(0, 100) + '...')
    }
    
    await headers() // Nécessaire pour Next.js
    
    console.log('👤 [REDIRECT-API] Récupération utilisateur...')
    const user = await getAuthUser()

    if (!user) {
      console.log('❌ [REDIRECT-API] Aucun utilisateur trouvé - cookies:', cookies ? 'présents mais invalides' : 'absents')
      return NextResponse.json({ redirectUrl: '/login' })
    }

    console.log('✅ [REDIRECT-API] Utilisateur trouvé:', { 
      id: user.id, 
      role: user.role, 
      schoolId: user.schoolId 
    })

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

    console.log('🚀 [REDIRECT-API] URL de redirection:', redirectUrl)
    return NextResponse.json({ redirectUrl })
  } catch (error) {
    console.error('💥 [REDIRECT-API] Erreur:', error)
    return NextResponse.json({ redirectUrl: '/login' }, { status: 500 })
  }
}
