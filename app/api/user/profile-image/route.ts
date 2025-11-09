import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import { uploadToS3, deleteFromS3, validateFile } from '@/lib/aws-s3'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const IMAGE_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'jpg', 'png', 'webp'],
}

/**
 * POST /api/user/profile-image
 * Upload ou mettre à jour l'image de profil
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Valider le fichier
    const validation = validateFile(file, IMAGE_CONFIG)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Récupérer l'ancienne image pour la supprimer
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { image: true },
    })

    // Upload vers S3 avec un nom unique
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `profile-${user.id}-${timestamp}.${fileExtension}`
    
    const fileUrl = await uploadToS3({
      file,
      fileName,
      folder: `${user.schoolId || 'global'}/profile-images`,
      contentType: file.type,
    })

    // Mettre à jour l'utilisateur avec la nouvelle image
    await prisma.user.update({
      where: { id: user.id },
      data: { image: fileUrl },
    })

    // Supprimer l'ancienne image si elle existe
    if (currentUser?.image) {
      try {
        await deleteFromS3(currentUser.image)
      } catch (error) {
        console.error('Erreur suppression ancienne image:', error)
        // Ne pas bloquer si la suppression échoue
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: fileUrl,
      message: 'Image de profil mise à jour avec succès',
    })
  } catch (error) {
    console.error('Erreur upload image profil:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload de l\'image' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/user/profile-image
 * Supprimer l'image de profil
 */
export async function DELETE() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer l'image actuelle
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { image: true },
    })

    if (!currentUser?.image) {
      return NextResponse.json({ error: 'Aucune image à supprimer' }, { status: 404 })
    }

    // Supprimer de S3
    await deleteFromS3(currentUser.image)

    // Mettre à jour la DB
    await prisma.user.update({
      where: { id: user.id },
      data: { image: null },
    })

    return NextResponse.json({
      success: true,
      message: 'Image de profil supprimée avec succès',
    })
  } catch (error) {
    console.error('Erreur suppression image profil:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'image' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/user/profile-image
 * Récupérer l'URL de l'image de profil actuelle
 */
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { image: true },
    })

    return NextResponse.json({
      imageUrl: currentUser?.image || null,
    })
  } catch (error) {
    console.error('Erreur récupération image profil:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'image' },
      { status: 500 }
    )
  }
}
