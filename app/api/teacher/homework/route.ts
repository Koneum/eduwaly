import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/teacher/homework
 * Récupérer les devoirs de l'enseignant par matière et classe
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer l'enseignant
    const teacher = await prisma.enseignant.findFirst({
      where: {
        userId: user.id,
        schoolId: user.schoolId,
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Enseignant non trouvé' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const moduleId = searchParams.get('moduleId')
    const filiereId = searchParams.get('filiereId')

    // Récupérer les modules de l'enseignant
    const emplois = await prisma.emploiDuTemps.findMany({
      where: {
        enseignantId: teacher.id,
      },
      include: {
        module: {
          include: {
            filiere: true,
          },
        },
      },
      distinct: ['moduleId'],
    })

  const moduleIds = emplois.map((e: any) => e.moduleId)

    // Construire le where
    const where: Record<string, unknown> = {
      moduleId: { in: moduleIds },
    }

    if (moduleId) {
      where.moduleId = moduleId
    }

    if (filiereId) {
      where.module = {
        filiereId,
      }
    }

    const homework = await prisma.homework.findMany({
      where,
      include: {
        module: {
          include: {
            filiere: true,
          },
        },
        submissions: {
          include: {
            student: {
              include: {
                user: true,
                filiere: true,
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: 'desc',
      },
    })

    return NextResponse.json(homework)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des devoirs' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/teacher/homework
 * Créer un nouveau devoir
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const teacher = await prisma.enseignant.findFirst({
      where: {
        userId: user.id,
        schoolId: user.schoolId,
      },
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Enseignant non trouvé' }, { status: 404 })
    }

    const body = await req.json()
    const { title, description, moduleId, dueDate, fileUrl, fileName, fileSize, fileType, assignmentType } = body

    if (!title || !moduleId || !dueDate) {
      return NextResponse.json(
        { error: 'Titre, module et date limite requis' },
        { status: 400 }
      )
    }

    const homework = await prisma.homework.create({
      data: {
        title,
        description,
        moduleId,
        enseignantId: teacher.id,
        dueDate: new Date(dueDate),
        type: 'Devoir', // Type de devoir
        assignmentType: assignmentType || 'INDIVIDUAL', // Type d'assignation
        fileUrl,
        fileName,
        fileSize,
        fileType,
      },
      include: {
        module: {
          include: {
            filiere: true,
          },
        },
      },
    })

    return NextResponse.json(homework)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du devoir' },
      { status: 500 }
    )
  }
}
