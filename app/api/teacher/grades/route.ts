import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/teacher/grades
 * Récupérer les notes pour un module/classe
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const moduleId = searchParams.get('moduleId')
    const filiereId = searchParams.get('filiereId')

    if (!moduleId) {
      return NextResponse.json(
        { error: 'Module requis' },
        { status: 400 }
      )
    }

    const where: any = {
      moduleId,
    }

    if (filiereId) {
      where.student = {
        filiereId,
      }
    }

    const evaluations = await prisma.evaluation.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
            filiere: true,
          },
        },
        module: true,
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(evaluations)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des notes' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/teacher/grades
 * Ajouter des notes (individuel ou groupe)
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
    const { moduleId, type, date, grades, fileUrl, fileName, fileSize, fileType } = body

    // type: DEVOIR, CONTROLE, EXAMEN, GROUPE
    // grades: [{ studentId, note, coefficient, groupName? }]

    if (!moduleId || !type || !date || !Array.isArray(grades)) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      )
    }

    // Créer les évaluations
    const evaluations = await Promise.all(
      grades.map((grade: any) =>
        prisma.evaluation.create({
          data: {
            studentId: grade.studentId,
            moduleId,
            teacherId: teacher.id,
            type,
            note: grade.note,
            coefficient: grade.coefficient || 1,
            date: new Date(date),
            groupName: grade.groupName,
            fileUrl,
            fileName,
            fileSize,
            fileType,
          },
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        })
      )
    )

    return NextResponse.json(evaluations)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout des notes' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/teacher/grades
 * Mettre à jour une note
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { id, note, coefficient, fileUrl, fileName, fileSize, fileType } = body

    if (!id || note === undefined) {
      return NextResponse.json(
        { error: 'ID et note requis' },
        { status: 400 }
      )
    }

    const evaluation = await prisma.evaluation.update({
      where: { id },
      data: {
        note,
        coefficient,
        fileUrl,
        fileName,
        fileSize,
        fileType,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    })

    return NextResponse.json(evaluation)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la note' },
      { status: 500 }
    )
  }
}
