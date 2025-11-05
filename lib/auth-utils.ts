// auth-util.ts
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

export type UserRole = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "STUDENT" | "PARENT"
| "MANAGER" | "PERSONNEL" | "ASSISTANT" | "SECRETARY"

export interface AuthUser {
  id: string
  email: string
  emailVerified: boolean
  name: string
  role: UserRole
  schoolId: string | null
  avatar?: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Récupère la session utilisateur côté serveur
 * AJOUT D'UN LOG DE DIAGNOSTIC
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    
    if (!session?.user) return null
    
    const user = session.user as unknown
    
    if (user && typeof user === 'object' && 'role' in user && 'schoolId' in user) {
        // ------------------------------------------------------------------
        // >> DIAGNOSTIC IMPORTANT : Vérifiez ces valeurs dans les logs Vercel après le login
        console.log(`[AUTH-UTIL] Session OK. Rôle: ${user.role}, School ID: ${user.schoolId}`);
        // ------------------------------------------------------------------
        return user as AuthUser
    }
    
    // ------------------------------------------------------------------
    // >> DIAGNOSTIC IMPORTANT : Si ce log apparaît, le rôle/schoolId est manquant dans la session
    console.warn(`[AUTH-UTIL] Session utilisateur incomplète:`, user);
    // ------------------------------------------------------------------
    return null
  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error)
    return null
  }
}

/**
 * Vérifie si l'utilisateur a le rôle requis
 */
export async function requireRole(roles: UserRole | UserRole[]) {
  const user = await getAuthUser()
  
  if (!user) {
    redirect("/login")
  }
  
  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  
  if (!allowedRoles.includes(user.role)) {
    redirect("/unauthorized")
  }
  
  return user
}

/**
 * Vérifie si l'utilisateur est un Super Admin
 */
export async function requireSuperAdmin() {
  return await requireRole("SUPER_ADMIN")
}

/**
 * Vérifie si l'utilisateur est un Admin d'école
 */
export async function requireSchoolAdmin() {
  return await requireRole("SCHOOL_ADMIN")
}

/**
 * Vérifie si l'utilisateur a accès au dashboard admin (SCHOOL_ADMIN ou staff avec permissions)
 */
export async function requireAdminDashboardAccess() {
  return await requireRole(["SCHOOL_ADMIN", "MANAGER", "PERSONNEL", "ASSISTANT", "SECRETARY"])
}

/**
 * Vérifie si l'utilisateur appartient à une école spécifique
 */
export async function requireSchoolAccess(schoolId: string) {
  const user = await getAuthUser()
  
  if (!user) {
    redirect("/login")
  }
  
  // Super Admin a accès à toutes les écoles
  if (user.role === "SUPER_ADMIN") {
    return user
  }
  
  // Vérifier que l'utilisateur appartient à cette école
  if (user.schoolId !== schoolId) {
    redirect("/unauthorized")
  }
  
  return user
}

/**
 * Redirige l'utilisateur vers son dashboard selon son rôle
 */
export function redirectToDashboard(user: AuthUser) {
  switch (user.role) {
    case "SUPER_ADMIN":
      return "/super-admin"
    case "SCHOOL_ADMIN":
      return `/admin/${user.schoolId}`
    case "TEACHER":
      return `/teacher/${user.schoolId}`
    case "STUDENT":
      return `/student/${user.schoolId}`
    case "PARENT":
      return `/parent/${user.schoolId}`
    case "MANAGER":
    case "PERSONNEL":
    case "ASSISTANT":
    case "SECRETARY":
      // Ces rôles ont accès au dashboard admin avec permissions limitées
      return `/admin/${user.schoolId}`
    default:
      return "/"
  }
}
