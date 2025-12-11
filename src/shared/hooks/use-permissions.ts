"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"

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

export function usePermissions() {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<UserPermission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!user) {
        setPermissions([])
        setIsLoading(false)
        return
      }

      try {
        const userId = (user as { id: string }).id
        const response = await fetch(`/api/admin/staff/${userId}`)
        if (response.ok) {
          const data = await response.json()
          setPermissions(data.permissions || [])
        }
      } catch (error) {
        console.error("Error fetching permissions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserPermissions()
  }, [user])

  const hasPermission = (category: string, action: 'view' | 'create' | 'edit' | 'delete'): boolean => {
    // SCHOOL_ADMIN a toutes les permissions
    const userRole = (user as { role: string })?.role
    if (userRole === 'SCHOOL_ADMIN' || userRole === 'SUPER_ADMIN') {
      return true
    }

    // Vérifier la permission spécifique
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

  const canView = (category: string) => hasPermission(category, 'view')
  const canCreate = (category: string) => hasPermission(category, 'create')
  const canEdit = (category: string) => hasPermission(category, 'edit')
  const canDelete = (category: string) => hasPermission(category, 'delete')

  const hasAnyPermission = (category: string) => {
    const userRole = (user as { role: string })?.role
    if (userRole === 'SCHOOL_ADMIN' || userRole === 'SUPER_ADMIN') {
      return true
    }

    const perm = permissions.find(p => p.permission.category === category)
    return perm ? (perm.canView || perm.canCreate || perm.canEdit || perm.canDelete) : false
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
  }
}
