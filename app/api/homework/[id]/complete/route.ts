import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/homework/[id]/complete
 * Marquer un devoir comme "J'ai terminé" (sans soumission de fichier)
 * 
 * Body: { isCompleted: boolean }
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const params = await context.params
    const { id: homeworkId } = params
    const body = await req.json()
    const { isCompleted } = body

    if (typeof isCompleted !== 'boolean') {
      return NextResponse.json(
        { error: 'isCompleted doit être un booléen' },
        { status: 400 }
      )
    }

    // Récupérer l'étudiant
    const student = await prisma.student.findFirst({
      where: {
        userId: user.id,
        schoolId: user.schoolId!,
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

    // Chercher ou créer une soumission
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
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        },
        include: {
          student: {
            include: { user: true },
          },
          homework: {
            include: { module: true },
          },
        },
      })

      return NextResponse.json({
        success: true,
        submission,
        message: isCompleted 
          ? 'Devoir marqué comme terminé' 
          : 'Marquage terminé retiré',
      })
    }

    // Créer une nouvelle soumission avec isCompleted
    const submission = await prisma.submission.create({
      data: {
        homeworkId,
        studentId: student.id,
        status: 'PENDING', // Pas encore soumis, juste marqué comme terminé
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
      include: {
        student: {
          include: { user: true },
        },
        homework: {
          include: { module: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      submission,
      message: 'Devoir marqué comme terminé',
    })
  } catch (error) {
    console.error('Erreur lors du marquage du devoir:', error)
    return NextResponse.json(
      { error: 'Erreur lors du marquage du devoir' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/homework/[id]/complete
 * Vérifier si l'étudiant a marqué le devoir comme terminé
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const params = await context.params
    const { id: homeworkId } = params

    const student = await prisma.student.findFirst({
      where: {
        userId: user.id,
        schoolId: user.schoolId!,
      },
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Étudiant non trouvé' },
        { status: 404 }
      )
    }

    const submission = await prisma.submission.findFirst({
      where: {
        homeworkId,
        studentId: student.id,
      },
      select: {
        id: true,
        isCompleted: true,
        completedAt: true,
        status: true,
      },
    })

    return NextResponse.json({
      isCompleted: submission?.isCompleted ?? false,
      completedAt: submission?.completedAt ?? null,
      status: submission?.status ?? null,
    })
  } catch (error) {
    console.error('Erreur lors de la vérification:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    )
  }
}
