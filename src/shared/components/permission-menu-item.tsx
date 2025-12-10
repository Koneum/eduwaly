"use client"

import { usePermissions } from "@/lib/use-permissions"
import { useAuth } from "@/lib/auth-context"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { ReactNode } from "react"

interface PermissionMenuItemProps {
  category: string
  action: 'view' | 'create' | 'edit' | 'delete'
  children: ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function PermissionMenuItem({ 
  category, 
  action, 
  children, 
  onClick,
  className = "",
  disabled = false
}: PermissionMenuItemProps) {
  const { user } = useAuth()
  const { hasPermission, isLoading } = usePermissions()

  // SCHOOL_ADMIN a toutes les permissions
  if (user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN') {
    return (
      <DropdownMenuItem onClick={onClick} className={className} disabled={disabled}>
        {children}
      </DropdownMenuItem>
    )
  }

  // Vérifier les permissions pour les autres rôles
  if (isLoading) {
    return null
  }

  if (!hasPermission(category, action)) {
    return null // Masquer l'élément si pas de permission
  }

  return (
    <DropdownMenuItem onClick={onClick} className={className} disabled={disabled}>
      {children}
    </DropdownMenuItem>
  )
}
