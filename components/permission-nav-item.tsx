"use client"

import { usePermissions } from "@/lib/use-permissions"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { ReactNode } from "react"

interface PermissionNavItemProps {
  category: string
  href: string
  children: ReactNode
  className?: string
  activeClassName?: string
  isActive?: boolean
}

export function PermissionNavItem({ 
  category, 
  href, 
  children, 
  className = "",
  activeClassName = "",
  isActive = false
}: PermissionNavItemProps) {
  const { user } = useAuth()
  const { hasAnyPermission, isLoading } = usePermissions()

  // SCHOOL_ADMIN a accès à tout
  if (user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN') {
    return (
      <Link 
        href={href} 
        className={`${className} ${isActive ? activeClassName : ''}`}
      >
        {children}
      </Link>
    )
  }

  // Vérifier les permissions pour les autres rôles
  if (isLoading) {
    return null // Ou un skeleton
  }

  if (!hasAnyPermission(category)) {
    return null // Masquer l'élément si pas de permission
  }

  return (
    <Link 
      href={href} 
      className={`${className} ${isActive ? activeClassName : ''}`}
    >
      {children}
    </Link>
  )
}
