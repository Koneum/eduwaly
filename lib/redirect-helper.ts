import { redirect } from 'next/navigation'
import { getAuthUser } from './auth-utils'

/**
 * Redirige l'utilisateur vers son dashboard approprié selon son rôle
 * Utilisé dans les pages côté serveur
 */
export async function redirectToDashboard() {
  const user = await getAuthUser()
  
  if (!user) {
    redirect('/login')
  }

  const { role, schoolId } = user

  switch (role) {
    case 'SUPER_ADMIN':
      redirect('/super-admin')
      break
    case 'SCHOOL_ADMIN':
    case 'MANAGER':
    case 'PERSONNEL':
    case 'ASSISTANT':
    case 'SECRETARY':
      redirect(`/admin/${schoolId}`)
      break
    case 'TEACHER':
      redirect(`/teacher/${schoolId}`)
      break
    case 'STUDENT':
      redirect(`/student/${schoolId}`)
      break
    case 'PARENT':
      redirect(`/parent/${schoolId}`)
      break
    default:
      redirect('/unauthorized')
  }
}

/**
 * Vérifie si l'utilisateur est connecté
 * Si oui, le redirige vers son dashboard
 * Utilisé sur les pages publiques comme /login
 */
export async function redirectIfAuthenticated() {
  const user = await getAuthUser()
  
  if (user) {
    await redirectToDashboard()
  }
}

/**
 * Vérifie si l'utilisateur a accès à une route spécifique
 */
export async function checkRouteAccess(requiredRole: string | string[], requiredSchoolId?: string) {
  const user = await getAuthUser()
  
  if (!user) {
    redirect('/login')
  }

  // SUPER_ADMIN a accès à tout
  if (user.role === 'SUPER_ADMIN') {
    return user
  }

  // Vérifier le rôle
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  if (!allowedRoles.includes(user.role)) {
    redirect('/unauthorized')
  }

  // Vérifier le schoolId si requis
  if (requiredSchoolId && user.schoolId !== requiredSchoolId) {
    redirect('/unauthorized')
  }

  return user
}
