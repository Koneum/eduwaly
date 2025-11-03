import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'
import { deleteFromS3 } from '@/lib/aws-s3'

export const dynamic = 'force-dynamic'

/**
 * GET /api/documents/[id]
 * Récupérer un document spécifique
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const params = await context.params
    const { id } = params

    const document = await prisma.document.findFirst({
      where: {
        id,
        module: {
          schoolId: user.schoolId,
        },
      },
      include: {
        module: {
          include: {
            filiere: true,
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Erreur lors de la récupération du document:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du document' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/documents/[id]
 * Mettre à jour un document
 */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const params = await context.params
    const { id } = params
    const body = await req.json()
    const { title, description, category } = body

    // Vérifier que le document existe et appartient à l'école
    const existingDocument = await prisma.document.findFirst({
      where: {
        id,
        module: {
          schoolId: user.schoolId,
        },
      },
    })

    if (!existingDocument) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      )
    }

    const document = await prisma.document.update({
      where: { id },
      data: {
        title,
        description,
        category,
      },
      include: {
        module: {
          include: {
            filiere: true,
          },
        },
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du document:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du document' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/documents/[id]
 * Supprimer un document
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const params = await context.params
    const { id } = params

    // Vérifier que le document existe et appartient à l'école
    const document = await prisma.document.findFirst({
      where: {
        id,
        module: {
          schoolId: user.schoolId,
        },
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer le fichier de S3
    try {
      await deleteFromS3(document.fileUrl)
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier S3:', error)
      // Continuer même si la suppression S3 échoue
    }

    // Supprimer le document de la base de données
    await prisma.document.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du document' },
      { status: 500 }
    )
  }
}
