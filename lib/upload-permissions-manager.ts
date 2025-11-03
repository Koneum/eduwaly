/**
 * Gestion des permissions d'upload personnalisées par utilisateur
 * Permet aux admins et enseignants d'accorder des permissions spéciales
 */

import { type UserRole, type UploadCategory } from './upload-permissions'

/**
 * Définir qui peut gérer les permissions de qui
 */
export const PERMISSION_MANAGEMENT_RULES: Record<UserRole, UserRole[]> = {
  SUPER_ADMIN: [], // Ne peut pas être géré
  SCHOOL_ADMIN: [
    'TEACHER',
    'STUDENT',
    'PARENT',
    'MANAGER',
    'PERSONNEL',
    'ASSISTANT',
    'SECRETARY',
  ], // Peut gérer tout le monde sauf SUPER_ADMIN
  TEACHER: ['STUDENT'], // Peut gérer uniquement les étudiants
  MANAGER: ['STUDENT', 'PERSONNEL', 'ASSISTANT', 'SECRETARY'], // Peut gérer le personnel et étudiants
  STUDENT: [], // Ne peut gérer personne
  PARENT: [], // Ne peut gérer personne
  PERSONNEL: [], // Ne peut gérer personne
  ASSISTANT: [], // Ne peut gérer personne
  SECRETARY: [], // Ne peut gérer personne
}

/**
 * Vérifier si un rôle peut gérer les permissions d'un autre rôle
 */
export function canManagePermissions(managerRole: UserRole, targetRole: UserRole): boolean {
  return PERMISSION_MANAGEMENT_RULES[managerRole].includes(targetRole)
}

/**
 * Obtenir la liste des rôles qu'un utilisateur peut gérer
 */
export function getManagedRoles(managerRole: UserRole): UserRole[] {
  return PERMISSION_MANAGEMENT_RULES[managerRole]
}

/**
 * Interface pour les permissions personnalisées d'un utilisateur
 */
export interface UserUploadPermissions {
  userId: string
  grantedBy: string // ID de l'utilisateur qui a accordé les permissions
  grantedAt: Date
  customCategories?: UploadCategory[] // Catégories supplémentaires autorisées
  customMaxSizes?: Partial<Record<UploadCategory, number>> // Tailles max personnalisées (en MB)
  expiresAt?: Date // Date d'expiration optionnelle
  reason?: string // Raison de l'octroi
}

/**
 * Vérifier si un utilisateur a des permissions personnalisées actives
 */
export function hasActiveCustomPermissions(permissions: UserUploadPermissions | null): boolean {
  if (!permissions) return false
  if (permissions.expiresAt && new Date(permissions.expiresAt) < new Date()) {
    return false // Permissions expirées
  }
  return true
}

/**
 * Fusionner les permissions par défaut avec les permissions personnalisées
 */
export function mergePermissions(
  defaultCategories: UploadCategory[],
  customPermissions: UserUploadPermissions | null
): UploadCategory[] {
  if (!hasActiveCustomPermissions(customPermissions)) {
    return defaultCategories
  }

  const customCategories = customPermissions!.customCategories || []
  // Fusionner et dédupliquer
  return Array.from(new Set([...defaultCategories, ...customCategories]))
}

/**
 * Obtenir la taille max effective pour une catégorie
 */
export function getEffectiveMaxSize(
  defaultSize: number,
  category: UploadCategory,
  customPermissions: UserUploadPermissions | null
): number {
  if (!hasActiveCustomPermissions(customPermissions)) {
    return defaultSize
  }

  const customSize = customPermissions!.customMaxSizes?.[category]
  return customSize !== undefined ? customSize : defaultSize
}

/**
 * Valider une demande d'octroi de permissions
 */
export function validatePermissionGrant(
  managerRole: UserRole,
  targetRole: UserRole,
  requestedCategories: UploadCategory[]
): { valid: boolean; error?: string } {
  // Vérifier si le manager peut gérer ce rôle
  if (!canManagePermissions(managerRole, targetRole)) {
    return {
      valid: false,
      error: `Votre rôle (${managerRole}) ne peut pas gérer les permissions de ${targetRole}`,
    }
  }

  // Vérifier que les catégories demandées sont valides
  const validCategories: UploadCategory[] = [
    'image',
    'document',
    'spreadsheet',
    'presentation',
    'video',
    'audio',
    'any',
  ]

  const invalidCategories = requestedCategories.filter((cat) => !validCategories.includes(cat))
  if (invalidCategories.length > 0) {
    return {
      valid: false,
      error: `Catégories invalides: ${invalidCategories.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Créer un objet de permissions personnalisées
 */
export function createCustomPermissions(
  userId: string,
  grantedBy: string,
  categories: UploadCategory[],
  maxSizes?: Partial<Record<UploadCategory, number>>,
  expiresInDays?: number,
  reason?: string
): UserUploadPermissions {
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : undefined

  return {
    userId,
    grantedBy,
    grantedAt: new Date(),
    customCategories: categories,
    customMaxSizes: maxSizes,
    expiresAt,
    reason,
  }
}

/**
 * Formater les permissions pour l'affichage
 */
export function formatPermissions(permissions: UserUploadPermissions): string {
  const parts: string[] = []

  if (permissions.customCategories && permissions.customCategories.length > 0) {
    parts.push(`Catégories: ${permissions.customCategories.join(', ')}`)
  }

  if (permissions.expiresAt) {
    const expiryDate = new Date(permissions.expiresAt).toLocaleDateString('fr-FR')
    parts.push(`Expire le: ${expiryDate}`)
  }

  if (permissions.reason) {
    parts.push(`Raison: ${permissions.reason}`)
  }

  return parts.join(' | ')
}
export { UserRole, UploadCategory }

