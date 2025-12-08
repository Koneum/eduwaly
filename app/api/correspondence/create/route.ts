import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

/**
 * POST /api/correspondence/create
 * Créer une nouvelle conversation entre un parent et un enseignant
 * 
 * Body: { teacherId, studentId?, message, schoolId }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { teacherId, studentId, message, schoolId } = body

    if (!teacherId || !message?.trim() || !schoolId) {
      return NextResponse.json(
        { error: 'teacherId, message et schoolId sont requis' },
        { status: 400 }
      )
    }

    // Vérifier que l'enseignant existe
    const teacher = await prisma.enseignant.findUnique({
      where: { id: teacherId },
      include: { user: true }
    })

    if (!teacher || !teacher.userId) {
      return NextResponse.json(
        { error: 'Enseignant non trouvé ou sans compte utilisateur' },
        { status: 404 }
      )
    }

    // Vérifier que le parent a bien un enfant dans cette école
    const parent = await prisma.parent.findFirst({
      where: {
        userId: user.id,
        students: {
          some: { schoolId }
        }
      },
      include: {
        students: {
          where: { schoolId }
        }
      }
    })

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent non trouvé dans cette école' },
        { status: 404 }
      )
    }

    // Vérifier s'il existe déjà une conversation entre ce parent et cet enseignant
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        schoolId,
        type: 'DIRECT',
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: teacher.userId } } }
        ]
      }
    })

    let conversationId: string

    if (existingConversation) {
      // Utiliser la conversation existante
      conversationId = existingConversation.id
    } else {
      // Créer une nouvelle conversation
      const studentInfo = studentId 
        ? await prisma.student.findUnique({
            where: { id: studentId },
            include: { user: true }
          })
        : null

      const conversationSubject = studentInfo
        ? `${teacher.titre || ''} ${teacher.prenom} ${teacher.nom} - ${studentInfo.user?.name || studentInfo.studentNumber}`.trim()
        : `${teacher.titre || ''} ${teacher.prenom} ${teacher.nom}`.trim()

      const conversation = await prisma.conversation.create({
        data: {
          schoolId,
          type: 'DIRECT',
          subject: conversationSubject,
          participants: {
            create: [
              { userId: user.id },
              { userId: teacher.userId }
            ]
          }
        }
      })

      conversationId = conversation.id
    }

    // Créer le message
    await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        senderName: user.name || 'Parent',
        senderRole: 'PARENT',
        content: message.trim()
      }
    })

    // Mettre à jour la date de la conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    // Créer une notification pour l'enseignant
    await prisma.notification.create({
      data: {
        userId: teacher.userId,
        schoolId,
        title: 'Nouveau message d\'un parent',
        message: `${user.name || 'Un parent'} vous a envoyé un message`,
        type: 'INFO',
        category: 'MESSAGE',
        actionUrl: `/teacher/${schoolId}/messages/${conversationId}`
      }
    })

    return NextResponse.json({
      success: true,
      conversationId
    })
  } catch (error) {
    console.error('Erreur lors de la création de la correspondance:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la correspondance' },
      { status: 500 }
    )
  }
}
