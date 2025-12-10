"use client"

import { useAuth } from "./auth-context"
import { useEffect, useState, useCallback } from "react"

interface UserPermission {
  id: string
  permission: {
    id: string
    name: string
    category: string
  }
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

/**
 * Hook pour gérer les permissions granulaires des utilisateurs
 * Compatible avec le système multi-écoles de Schooly
 * 
 * @example
 * ```tsx
 * const { canCreate, canEdit, canDelete } = usePermissions()
 * 
 * if (canCreate('students')) {
 *   return <Button>Ajouter un étudiant</Button>
 * }
 * ```
 */
export function usePermissions() {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<UserPermission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchUserPermissions = useCallback(async () => {
    if (!user) {
      setPermissions([])
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/permissions/user/${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setPermissions(data.permissions || [])
      }
    } catch (error) {
      console.error("Error fetching permissions:", error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchUserPermissions()
  }, [fetchUserPermissions])

  /**
   * Vérifie si l'utilisateur a une permission spécifique
   * SUPER_ADMIN et SCHOOL_ADMIN ont toutes les permissions
   */
  const hasPermission = (
    category: string, 
    action: 'view' | 'create' | 'edit' | 'delete'
  ): boolean => {
    if (!user) return false

    // SUPER_ADMIN a toutes les permissions sur toutes les écoles
    if (user.role === 'SUPER_ADMIN') {
      return true
    }

    // SCHOOL_ADMIN a toutes les permissions sur son école
    if (user.role === 'SCHOOL_ADMIN') {
      return true
    }

    // Pour les autres rôles (MANAGER, PERSONNEL, ASSISTANT, SECRETARY)
    // Vérifier les permissions spécifiques
    const perm = permissions.find(p => p.permission.category === category)
    if (!perm) return false

    switch (action) {
      case 'view':
        return perm.canView
      case 'create':
        return perm.canCreate
      case 'edit':
        return perm.canEdit
      case 'delete':
        return perm.canDelete
      default:
        return false
    }
  }

  // Helpers pour une utilisation plus facile
  const canView = (category: string) => hasPermission(category, 'view')
  const canCreate = (category: string) => hasPermission(category, 'create')
  const canEdit = (category: string) => hasPermission(category, 'edit')
  const canDelete = (category: string) => hasPermission(category, 'delete')

  /**
   * Vérifie si l'utilisateur a n'importe quelle permission sur une catégorie
   */
  const hasAnyPermission = (category: string): boolean => {
    if (!user) return false
    
    if (user.role === 'SUPER_ADMIN' || user.role === 'SCHOOL_ADMIN') {
      return true
    }

    const perm = permissions.find(p => p.permission.category === category)
    return perm ? (perm.canView || perm.canCreate || perm.canEdit || perm.canDelete) : false
  }

  /**
   * Vérifie si l'utilisateur a accès à une école spécifique
   */
  const hasSchoolAccess = (schoolId: string): boolean => {
    if (!user) return false
    
    // SUPER_ADMIN a accès à toutes les écoles
    if (user.role === 'SUPER_ADMIN') return true
    
    // Les autres utilisateurs doivent appartenir à l'école
    return user.schoolId === schoolId
  }

  return {
    permissions,
    isLoading,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    hasAnyPermission,
    hasSchoolAccess,
  }
}
