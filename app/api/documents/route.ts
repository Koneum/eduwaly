import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/documents
 * Récupérer les documents (ressources pédagogiques)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const moduleId = searchParams.get('moduleId')
    const category = searchParams.get('category')

    const where: any = {
      module: {
        schoolId: user.schoolId,
      },
    }

    if (moduleId) {
      where.moduleId = moduleId
    }

    if (category) {
      where.category = category
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        module: {
          include: {
            filiere: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Erreur lors de la récupération des documents:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des documents' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/documents
 * Créer un nouveau document
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, fileUrl, fileName, fileSize, mimeType, moduleId, category } = body

    // Validation
    if (!title || !fileUrl || !moduleId) {
      return NextResponse.json(
        { error: 'Titre, fichier et module requis' },
        { status: 400 }
      )
    }

    // Vérifier que le module appartient à l'école
    const moduleRecord = await prisma.module.findFirst({
      where: {
        id: moduleId,
        schoolId: user.schoolId,
      },
    })

    if (!moduleRecord) {
      return NextResponse.json(
        { error: 'Module non trouvé' },
        { status: 404 }
      )
    }

    const document = await prisma.document.create({
      data: {
        title,
        description,
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        schoolId: user.schoolId,
        moduleId,
        category: category || 'COURSE',
        uploadedBy: user.id,
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
    console.error('Erreur lors de la création du document:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du document' },
      { status: 500 }
    )
  }
}
