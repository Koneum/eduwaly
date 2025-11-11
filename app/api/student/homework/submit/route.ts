import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const student = await prisma.student.findUnique({
      where: { userId: user.id }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Étudiant non trouvé' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const homeworkId = formData.get('homeworkId') as string
    const content = formData.get('content') as string
    const file = formData.get('file') as File | null

    if (!homeworkId || !content) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Vérifier que le devoir existe
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId }
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
        studentId: student.id,
        homeworkId: homeworkId
      }
    })

    let fileUrl = null
    
    // Si un fichier est fourni, le sauvegarder (à implémenter avec votre système de stockage)
    if (file) {
      // TODO: Upload vers S3 ou autre service de stockage
      // Pour l'instant, on stocke juste le nom du fichier
      fileUrl = `/uploads/homework/${Date.now()}_${file.name}`
    }

    if (existingSubmission) {
      // Mettre à jour la soumission existante
      const updatedSubmission = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          content,
          fileUrl: fileUrl || existingSubmission.fileUrl,
          submittedAt: new Date()
        }
      })

      return NextResponse.json(updatedSubmission)
    } else {
      // Créer une nouvelle soumission
      const submission = await prisma.submission.create({
        data: {
          studentId: student.id,
          homeworkId: homeworkId,
          content,
          fileUrl,
          submittedAt: new Date()
        }
      })

      return NextResponse.json(submission)
    }
  } catch (error) {
    console.error('Erreur lors de la soumission:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
