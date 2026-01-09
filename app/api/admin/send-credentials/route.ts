import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'
import { sendEnrollmentCredentials } from '@/lib/brevo-email'

// POST - Envoyer les credentials d'un étudiant par email
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { studentId } = body

    if (!studentId) {
      return NextResponse.json({ error: 'ID étudiant manquant' }, { status: 400 })
    }

    // Récupérer l'étudiant avec son user et l'école
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        school: {
          select: {
            name: true
          }
        }
      }
    })

    if (!student || student.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 })
    }

    if (!student.user?.email) {
      return NextResponse.json({ error: 'Email étudiant non défini' }, { status: 400 })
    }

    // Préparer les données pour l'email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://educwaly.com'
    const enrollmentUrl = `${baseUrl}/enroll?school=${student.schoolId}`
    
    // Envoyer l'email via Brevo
    const emailResult = await sendEnrollmentCredentials(
      student.user.name,
      student.user.email,
      student.enrollmentId,
      enrollmentUrl,
      student.school.name
    )

    if (!emailResult.success) {
      return NextResponse.json({ 
        error: emailResult.error || 'Erreur lors de l\'envoi de l\'email' 
      }, { status: 500 })
    }

    // Créer une notification pour l'étudiant
    await prisma.notification.create({
      data: {
        userId: student.userId!,
        schoolId: student.schoolId,
        title: 'Identifiants de connexion envoyés',
        message: `Vos identifiants ont été envoyés à ${student.user.email}`,
        type: 'INFO',
        category: 'SYSTEM',
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Email envoyé avec succès',
      data: {
        email: student.user.email,
        enrollmentCode: student.enrollmentId,
        enrollmentUrl
      }
    })
  } catch (error) {
    console.error('Erreur envoi credentials:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
