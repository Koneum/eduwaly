import { useSession } from '@/lib/auth-client'
import { 
  canUploadCategory, 
  canDownload, 
  getAllowedCategories, 
  getMaxFileSize,
  CATEGORY_EXTENSIONS,
  type UserRole, 
  type UploadCategory 
} from '@/lib/upload-permissions'

/**
 * Hook pour gérer les permissions d'upload basées sur le rôle de l'utilisateur
 */
export function useUploadPermissions() {
  const { data: session } = useSession()
  const userRole = ((session?.user as any)?.role as UserRole) || 'STUDENT'

  return {
    /**
     * Vérifier si l'utilisateur peut uploader une catégorie
     */
    canUpload: (category: UploadCategory) => canUploadCategory(userRole, category),

    /**
     * Vérifier si l'utilisateur peut télécharger
     */
    canDownloadFiles: () => canDownload(userRole),

    /**
     * Obtenir les catégories autorisées
     */
    allowedCategories: getAllowedCategories(userRole),

    /**
     * Obtenir la taille max pour une catégorie
     */
    getMaxSize: (category: UploadCategory) => getMaxFileSize(userRole, category),

    /**
     * Obtenir les extensions autorisées pour une catégorie
     */
    getAllowedExtensions: (category: UploadCategory) => CATEGORY_EXTENSIONS[category],

    /**
     * Rôle de l'utilisateur
     */
    userRole,
  }
}
