import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// POST - Envoyer un message dans une conversation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { content, attachments = [] } = body

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Le contenu du message est requis' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur est participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id
        }
      }
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'Accès non autorisé à cette conversation' },
        { status: 403 }
      )
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        content,
        attachments: JSON.stringify(attachments),
        readBy: JSON.stringify([user.id])
      }
    })

    // Mettre à jour la conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    // Créer des notifications pour les autres participants
    const otherParticipants = await prisma.conversationParticipant.findMany({
      where: {
        conversationId,
        userId: { not: user.id }
      }
    })

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { subject: true, schoolId: true }
    })

    // Créer les notifications
    await prisma.notification.createMany({
      data: otherParticipants.map(p => ({
        userId: p.userId,
        schoolId: conversation?.schoolId || null,
        title: 'Nouveau message',
        message: `${user.name} vous a envoyé un message`,
        type: 'INFO',
        category: 'MESSAGE',
        actionUrl: `/messages/${conversationId}`,
        actionLabel: 'Voir le message',
        metadata: JSON.stringify({
          conversationId,
          messageId: message.id,
          senderId: user.id
        })
      }))
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du message' },
      { status: 500 }
    )
  }
}
