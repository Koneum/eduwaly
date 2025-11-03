"use client"

import { Button, ButtonProps } from "@/components/ui/button"
import { usePermissions } from "@/lib/use-permissions"
import { useAuth } from "@/lib/auth-context"

interface PermissionButtonProps extends ButtonProps {
  category: string
  action: 'view' | 'create' | 'edit' | 'delete'
  children: React.ReactNode
}

export function PermissionButton({ 
  category, 
  action, 
  children, 
  ...props 
}: PermissionButtonProps) {
  const { user } = useAuth()
  const { hasPermission, isLoading } = usePermissions()

  // SCHOOL_ADMIN a toutes les permissions
  if (user?.role === 'SCHOOL_ADMIN') {
    return <Button {...props}>{children}</Button>
  }

  // Vérifier les permissions pour les autres rôles
  if (isLoading) {
    return <Button {...props} disabled>{children}</Button>
  }

  if (!hasPermission(category, action)) {
    return null // Masquer le bouton si pas de permission
  }

  return <Button {...props}>{children}</Button>
}
