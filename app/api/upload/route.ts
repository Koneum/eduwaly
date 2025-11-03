import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import { uploadToS3, validateFile } from '@/lib/aws-s3'
import { canUploadCategory, getMaxFileSize, getUploadErrorMessage, type UserRole, type UploadCategory } from '@/lib/upload-permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Configuration des types de fichiers autorisés par catégorie
const FILE_CONFIGS = {
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'jpg', 'png', 'gif', 'webp'],
  },
  document: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'pdf', 'doc', 'docx'],
  },
  spreadsheet: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xls', 'xlsx', 'csv'],
  },
  presentation: {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'ppt', 'pptx'],
  },
  video: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['video/mp4', 'video/mpeg', 'video/quicktime', 'mp4', 'mpeg', 'mov'],
  },
  audio: {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'mp3', 'wav', 'ogg'],
  },
  any: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [],
  },
}

/**
 * POST /api/upload
 * Upload un fichier vers S3
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer les données du formulaire
    const formData = await req.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'uploads'
    const category = (formData.get('category') as string) || 'any'

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Vérifier les permissions d'upload
    const uploadCategory = category as UploadCategory
    const userRole = user.role as UserRole
    
    if (!canUploadCategory(userRole, uploadCategory)) {
      const errorMessage = getUploadErrorMessage(userRole, uploadCategory)
      return NextResponse.json(
        { error: errorMessage },
        { status: 403 }
      )
    }

    // Obtenir la taille maximale autorisée pour ce rôle et cette catégorie
    const maxSizeMB = getMaxFileSize(userRole, uploadCategory)
    const maxSizeBytes = maxSizeMB * 1024 * 1024

    // Récupérer la configuration selon la catégorie
    const baseConfig = FILE_CONFIGS[category as keyof typeof FILE_CONFIGS] || FILE_CONFIGS.any
    
    // Créer une copie de la config avec la taille max basée sur les permissions
    const config = {
      maxSize: maxSizeBytes,
      allowedTypes: baseConfig.allowedTypes.length > 0 ? baseConfig.allowedTypes : undefined
    }

    // Valider le fichier
    const validation = validateFile(file, config)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Structure simplifiée et cohérente pour tous les uploads
    // Format: schoolId/category (pas de sous-dossiers supplémentaires)
    const uploadFolder = `${user.schoolId || 'global'}/${category}`

    // Upload vers S3
    const fileUrl = await uploadToS3({
      file,
      fileName: file.name,
      folder: uploadFolder,
      contentType: file.type,
    })

    // Retourner les informations du fichier
    return NextResponse.json({
      success: true,
      file: {
        url: fileUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedBy: user.id,
        uploadedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload du fichier' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/upload
 * Retourner les configurations d'upload
 */
export async function GET() {
  return NextResponse.json({
    configs: FILE_CONFIGS,
    supportedCategories: Object.keys(FILE_CONFIGS),
  })
}
