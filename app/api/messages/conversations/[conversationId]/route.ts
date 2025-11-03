import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// GET - Récupérer les messages d'une conversation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
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

    // Récupérer la conversation avec les messages
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          where: { isDeleted: false }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation non trouvée' },
        { status: 404 }
      )
    }

    // Mettre à jour la date de dernière lecture
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id
        }
      },
      data: { lastReadAt: new Date() }
    })

    // Marquer les messages comme lus
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: user.id },
        readBy: { not: { contains: user.id } }
      },
      data: {
        readBy: {
          set: user.id // This will need to be handled differently for JSON arrays
        }
      }
    })

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Erreur lors de la récupération de la conversation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la conversation' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer/Archiver une conversation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Archiver pour l'utilisateur
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id
        }
      },
      data: { isArchived: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de l\'archivage de la conversation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'archivage de la conversation' },
      { status: 500 }
    )
  }
}
