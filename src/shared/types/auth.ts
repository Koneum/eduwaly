import type { Session, User } from "better-auth/types"

export type UserRole = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "STUDENT" | "PARENT" 
| "MANAGER" | "PERSONNEL" | "ASSISTANT" | "SECRETARY"

export interface ExtendedUser extends User {
  role: UserRole
  schoolId?: string
  avatar?: string
  isActive?: boolean
  lastLoginAt?: Date
}

export interface ExtendedSession extends Session {
  user: ExtendedUser
}
