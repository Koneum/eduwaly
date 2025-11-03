/**
 * Configuration des permissions d'upload par rôle
 */

export type UserRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'MANAGER' | 'PERSONNEL' | 'ASSISTANT' | 'SECRETARY'

export type UploadCategory = 'image' | 'document' | 'spreadsheet' | 'presentation' | 'video' | 'audio' | 'any'

interface RolePermissions {
  canUpload: UploadCategory[]
  canDownload: boolean
  maxFileSize: {
    [key in UploadCategory]?: number // en MB
  }
}

/**
 * Permissions d'upload par rôle
 */
export const UPLOAD_PERMISSIONS: Record<UserRole, RolePermissions> = {
  SUPER_ADMIN: {
    canUpload: ['image', 'document', 'spreadsheet', 'presentation', 'video', 'audio', 'any'],
    canDownload: true,
    maxFileSize: {
      image: 10,
      document: 20,
      spreadsheet: 20,
      presentation: 50,
      video: 200,
      audio: 50,
      any: 100,
    },
  },
  SCHOOL_ADMIN: {
    canUpload: ['image', 'document', 'spreadsheet', 'presentation', 'video', 'audio', 'any'],
    canDownload: true,
    maxFileSize: {
      image: 10,
      document: 20,
      spreadsheet: 20,
      presentation: 50,
      video: 200,
      audio: 50,
      any: 100,
    },
  },
  TEACHER: {
    canUpload: ['image', 'document', 'spreadsheet', 'presentation', 'video', 'audio', 'any'],
    canDownload: true,
    maxFileSize: {
      image: 10,
      document: 20,
      spreadsheet: 20,
      presentation: 50,
      video: 200,
      audio: 50,
      any: 100,
    },
  },
  STUDENT: {
    canUpload: ['image', 'document', 'spreadsheet', 'presentation'],
    canDownload: true,
    maxFileSize: {
      image: 5,
      document: 10,
      spreadsheet: 10,
      presentation: 20,
    },
  },
  PARENT: {
    canUpload: ['image', 'document', 'spreadsheet'], // Pas de vidéo
    canDownload: true,
    maxFileSize: {
      image: 5,
      document: 10,
      spreadsheet: 10,
    },
  },
  MANAGER: {
    canUpload: ['image', 'document', 'spreadsheet', 'presentation', 'video', 'audio', 'any'],
    canDownload: true,
    maxFileSize: {
      image: 10,
      document: 20,
      spreadsheet: 20,
      presentation: 50,
      video: 200,
      audio: 50,
      any: 100,
    },
  },
  PERSONNEL: {
    canUpload: ['image', 'document', 'spreadsheet'],
    canDownload: true,
    maxFileSize: {
      image: 5,
      document: 10,
      spreadsheet: 10,
    },
  },
  ASSISTANT: {
    canUpload: ['image', 'document', 'spreadsheet', 'presentation'],
    canDownload: true,
    maxFileSize: {
      image: 5,
      document: 10,
      spreadsheet: 10,
      presentation: 20,
    },
  },
  SECRETARY: {
    canUpload: ['image', 'document', 'spreadsheet'],
    canDownload: true,
    maxFileSize: {
      image: 5,
      document: 10,
      spreadsheet: 10,
    },
  },
}

/**
 * Vérifier si un rôle peut uploader une catégorie de fichier
 */
export function canUploadCategory(role: UserRole, category: UploadCategory): boolean {
  const permissions = UPLOAD_PERMISSIONS[role]
  return permissions.canUpload.includes(category)
}

/**
 * Vérifier si un rôle peut télécharger des fichiers
 */
export function canDownload(role: UserRole): boolean {
  return UPLOAD_PERMISSIONS[role].canDownload
}

/**
 * Obtenir la taille maximale pour une catégorie et un rôle
 */
export function getMaxFileSize(role: UserRole, category: UploadCategory): number {
  const permissions = UPLOAD_PERMISSIONS[role]
  return permissions.maxFileSize[category] || 10 // 10MB par défaut
}

/**
 * Obtenir les catégories autorisées pour un rôle
 */
export function getAllowedCategories(role: UserRole): UploadCategory[] {
  return UPLOAD_PERMISSIONS[role].canUpload
}

/**
 * Obtenir un message d'erreur si l'upload n'est pas autorisé
 */
export function getUploadErrorMessage(role: UserRole, category: UploadCategory): string | null {
  if (!canUploadCategory(role, category)) {
    const allowedCategories = getAllowedCategories(role)
    return `Votre rôle (${role}) ne peut pas uploader de fichiers de type "${category}". Types autorisés: ${allowedCategories.join(', ')}`
  }
  return null
}

/**
 * Mapper les catégories aux types MIME
 */
export const CATEGORY_MIME_TYPES: Record<UploadCategory, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  spreadsheet: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ],
  presentation: [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  video: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
  any: [],
}

/**
 * Obtenir les extensions de fichiers pour une catégorie
 */
export const CATEGORY_EXTENSIONS: Record<UploadCategory, string[]> = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  document: ['.pdf', '.doc', '.docx', '.txt'],
  spreadsheet: ['.xls', '.xlsx', '.csv'],
  presentation: ['.ppt', '.pptx'],
  video: ['.mp4', '.mpeg', '.mov', '.avi', '.webm'],
  audio: ['.mp3', '.wav', '.ogg', '.m4a'],
  any: [],
}
