"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { useSession, signIn as betterAuthSignIn, signOut as betterAuthSignOut, signUp as betterAuthSignUp } from "./auth-client"

interface User {
  id: string
  email: string
  name: string
  role: "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "STUDENT" | "PARENT"| "MANAGER" | "PERSONNEL" | "ASSISTANT" | "SECRETARY"
  schoolId?: string
  avatar?: string
  isActive?: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: any; data?: any }>
  signUp: (email: string, password: string, name: string, role?: string) => Promise<{ error?: any; data?: any }>
  signOut: () => Promise<void>
  isAdmin: boolean
  isSuperAdmin: boolean
  isSchoolAdmin: boolean
  isTeacher: boolean
  isStudent: boolean
  isParent: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()

  const user = session?.user ? {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: (session.user as any).role as "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "STUDENT" | "PARENT" | "MANAGER" | "PERSONNEL" | "ASSISTANT" | "SECRETARY",
    schoolId: (session.user as any).schoolId,
    avatar: (session.user as any).avatar,
    isActive: (session.user as any).isActive,
  } : null

  const handleSignIn = async (email: string, password: string) => {
    try {
      const result = await betterAuthSignIn.email({
        email,
        password,
      })
      return result
    } catch (error) {
      return { error }
    }
  }

  const handleSignUp = async (email: string, password: string, name: string, role?: string) => {
    try {
      const result = await betterAuthSignUp.email({
        email,
        password,
        name,
      })
      return result
    } catch (error) {
      return { error }
    }
  }

  const handleSignOut = async () => {
    await betterAuthSignOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isPending,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
        isAdmin: user ? ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role) : false,
        isSuperAdmin: user?.role === 'SUPER_ADMIN',
        isSchoolAdmin: user?.role === 'SCHOOL_ADMIN',
        isTeacher: user?.role === 'TEACHER',
        isStudent: user?.role === 'STUDENT',
        isParent: user?.role === 'PARENT',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
