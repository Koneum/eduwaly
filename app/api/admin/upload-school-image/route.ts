import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'
import { deleteFromS3, uploadToS3,  } from '@/lib/aws-s3'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/upload-school-image
 * Upload logo ou cachet de l'école
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const schoolId = formData.get('schoolId') as string
    const type = formData.get('type') as 'logo' | 'stamp' // logo ou stamp

    if (!file || !schoolId || !type) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Vérifier que l'admin appartient à cette école
    if (user.schoolId !== schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Le fichier doit être une image' }, { status: 400 })
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'L\'image ne doit pas dépasser 5 MB' }, { status: 400 })
    }

    // Récupérer l'école pour supprimer l'ancien logo/stamp si existe
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { logo: true, stamp: true }
    })

    if (!school) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    // Supprimer l'ancien fichier S3 si existe
    const oldUrl = type === 'logo' ? school.logo : school.stamp
    if (oldUrl) {
      try {
        await deleteFromS3(oldUrl)
      } catch (error) {
        console.error('Erreur suppression ancien fichier:', error)
      }
    }

    // Upload vers S3
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${type}-${schoolId}-${Date.now()}.${file.name.split('.').pop()}`
    const url = await uploadToS3({
      file: buffer,
      fileName,
      folder: type === 'logo' ? 'school-logos' : 'school-stamps',
      contentType: file.type
    })

    // Mettre à jour l'école
    const updateData = type === 'logo' ? { logo: url } : { stamp: url }
    await prisma.school.update({
      where: { id: schoolId },
      data: updateData
    })

    return NextResponse.json({
      message: `${type === 'logo' ? 'Logo' : 'Cachet'} téléchargé avec succès`,
      url
    })
  } catch (error) {
    console.error('Erreur upload:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/upload-school-image
 * Supprimer logo ou cachet de l'école
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { schoolId, type } = body as { schoolId: string; type: 'logo' | 'stamp' }

    if (!schoolId || !type) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Vérifier que l'admin appartient à cette école
    if (user.schoolId !== schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Récupérer l'école
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { logo: true, stamp: true }
    })

    if (!school) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    // Supprimer de S3
    const url = type === 'logo' ? school.logo : school.stamp
    if (url) {
      try {
        await deleteFromS3(url)
      } catch (error) {
        console.error('Erreur suppression S3:', error)
      }
    }

    // Mettre à jour l'école
    const updateData = type === 'logo' ? { logo: null } : { stamp: null }
    await prisma.school.update({
      where: { id: schoolId },
      data: updateData
    })

    return NextResponse.json({
      message: `${type === 'logo' ? 'Logo' : 'Cachet'} supprimé avec succès`
    })
  } catch (error) {
    console.error('Erreur suppression:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}
