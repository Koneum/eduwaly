import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

/**
 * POST /api/homework/[id]/submissions
 * Soumettre un devoir avec fichiers
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const params = await context.params
    const { id: homeworkId } = params
    const body = await req.json()
    const { content, fileUrl } = body

    // Vérifier que l'utilisateur est un étudiant
    const student = await prisma.student.findFirst({
      where: {
        userId: user.id,
        schoolId: user.schoolId,
      },
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Étudiant non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que le devoir existe
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
    })

    if (!homework) {
      return NextResponse.json(
        { error: 'Devoir non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si une soumission existe déjà
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        homeworkId,
        studentId: student.id,
      },
    })

    if (existingSubmission) {
      // Mettre à jour la soumission existante
      const submission = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          content,
          fileUrl,
          submittedAt: new Date(),
          status: 'SUBMITTED',
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
          homework: {
            include: {
              module: true,
            },
          },
        },
      })

      return NextResponse.json(submission)
    }

    // Créer une nouvelle soumission
    const submission = await prisma.submission.create({
      data: {
        homeworkId,
        studentId: student.id,
        content,
        fileUrl,
        status: 'SUBMITTED',
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        homework: {
          include: {
            module: true,
          },
        },
      },
    })

    return NextResponse.json(submission)
  } catch (error) {
    console.error('Erreur lors de la soumission du devoir:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la soumission du devoir' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/homework/[id]/submissions
 * Récupérer les soumissions d'un devoir
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
    const { id: homeworkId } = params

    // Vérifier que le devoir existe
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        module: {
          include: {
            school: true,
          },
        },
      },
    })

    if (!homework) {
      return NextResponse.json(
        { error: 'Devoir non trouvé' },
        { status: 404 }
      )
    }

    const submissions = await prisma.submission.findMany({
      where: {
        homeworkId,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    })

    return NextResponse.json(submissions)
  } catch (error) {
    console.error('Erreur lors de la récupération des soumissions:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des soumissions' },
      { status: 500 }
    )
  }
}
