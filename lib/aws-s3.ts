import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Configuration du client S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'schooly-files'

export interface UploadOptions {
  file: File | Buffer | ArrayBuffer | Uint8Array
  fileName: string
  folder?: string
  contentType?: string
}

/**
 * Upload un fichier vers S3
 */
export async function uploadToS3(options: UploadOptions): Promise<string> {
  const { file, fileName, folder = 'uploads', contentType } = options

  // Générer un nom de fichier unique
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const key = `${folder}/${timestamp}-${sanitizedFileName}`

  // Préparer le buffer
  let buffer: Buffer
  if (Buffer.isBuffer(file)) {
    buffer = file as Buffer
  } else if (
    typeof file === 'object' &&
    file !== null &&
    typeof (file as { arrayBuffer?: unknown }).arrayBuffer === 'function'
  ) {
    // File-like (browser File)
    const arrayBuffer = await (file as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer()
    buffer = Buffer.from(arrayBuffer)
  } else if (file instanceof ArrayBuffer) {
    buffer = Buffer.from(file)
  } else if (file instanceof Uint8Array) {
    buffer = Buffer.from(file)
  } else {
    throw new Error('Unsupported file type for upload')
  }

  // Upload vers S3
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
  ContentType: contentType || ((file as { type?: string }).type ?? 'application/octet-stream'),
    ACL: 'public-read', // Rendre le fichier accessible publiquement
  })

  await s3Client.send(command)

  // Retourner l'URL publique
  const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`
  return url
}

/**
 * Supprimer un fichier de S3
 */
export async function deleteFromS3(fileUrl: string): Promise<void> {
  try {
    // Extraire la clé du fichier depuis l'URL
    const url = new URL(fileUrl)
    const key = url.pathname.substring(1) // Enlever le "/" initial

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)
  } catch (error) {
    console.error('Erreur lors de la suppression du fichier:', error)
    throw new Error('Impossible de supprimer le fichier')
  }
}

/**
 * Générer une URL signée pour un upload direct (optionnel)
 */
export async function getPresignedUploadUrl(
  fileName: string,
  folder: string = 'uploads',
  expiresIn: number = 3600
): Promise<{ url: string; key: string }> {
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const key = `${folder}/${timestamp}-${sanitizedFileName}`

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  const url = await getSignedUrl(s3Client, command, { expiresIn })

  return { url, key }
}

/**
 * Valider un fichier avant upload
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number // en bytes
    allowedTypes?: string[]
  } = {}
): { valid: boolean; error?: string } {
  const { maxSize = 10 * 1024 * 1024, allowedTypes } = options // 10MB par défaut

  // Vérifier la taille
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Le fichier est trop volumineux. Taille maximale: ${maxSize / (1024 * 1024)}MB`,
    }
  }

  // Vérifier le type
  if (allowedTypes && allowedTypes.length > 0) {
    const fileType = file.type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    const isTypeAllowed = allowedTypes.some(
      (type) =>
        fileType.includes(type) ||
        (fileExtension && type.includes(fileExtension))
    )

    if (!isTypeAllowed) {
      return {
        valid: false,
        error: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`,
      }
    }
  }

  return { valid: true }
}

/**
 * Formater la taille d'un fichier
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
