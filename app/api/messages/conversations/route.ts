import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'
import { checkFeatureAccess } from '@/lib/check-plan-limit'

// GET - Récupérer toutes les conversations de l'utilisateur
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier si la messagerie est disponible dans le plan
    if (user.schoolId) {
      const featureCheck = await checkFeatureAccess(user.schoolId, 'messaging')
      if (!featureCheck.allowed) {
        return NextResponse.json({ 
          error: 'Fonctionnalité non disponible',
          message: featureCheck.error,
          upgradeRequired: true
        }, { status: 403 })
      }
    }

    // Récupérer les conversations où l'utilisateur est participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: user.id
          }
        }
      },
      include: {
        participants: {
          include: {
            conversation: {
              include: {
                messages: {
                  orderBy: { createdAt: 'desc' },
                  take: 1
                }
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Enrichir avec les informations des participants
    type ConversationRow = {
      id: string
      participants: Array<{ userId: string }>
      messages: Array<{
        id: string
        content?: string
        createdAt?: Date
        conversationId?: string
        isDeleted?: boolean
        senderId?: string
        senderName?: string
      }>
    }

    type OtherUserSelect = {
      id: string
      name: string
      email?: string | null
      role?: string
      avatar?: string | null
      school?: { name?: string | null } | null
    }

    const enrichedConversations = await Promise.all(
      (conversations as ConversationRow[]).map(async (conv: ConversationRow) => {
        const participantIds = conv.participants
          .map(p => p.userId)
          .filter(id => id !== user.id)

        const otherUsers = await prisma.user.findMany({
          where: { id: { in: participantIds } },
          select: { 
            id: true, 
            name: true, 
            email: true, 
            role: true, 
            avatar: true,
            schoolId: true,
            school: {
              select: {
                name: true,
              },
            },
          }
        })
        
        // Enrichir avec le nom de l'école pour les admins d'école
        const enrichedUsers = (otherUsers as OtherUserSelect[]).map((u: OtherUserSelect) => ({
          id: u.id,
          name: u.name,
          email: u.email ?? null,
          role: u.role,
          avatar: u.avatar ?? null,
          schoolName: u.role === 'SCHOOL_ADMIN' && u.school?.name 
            ? u.school.name 
            : null,
        }))

        const lastMessage = conv.messages[0]
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: user.id },
            readBy: { not: { contains: user.id } }
          }
        })

        return {
          ...conv,
          otherUsers: enrichedUsers,
          lastMessage,
          unreadCount
        }
      })
    )

    return NextResponse.json(enrichedConversations)
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des conversations' },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle conversation
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier si la messagerie est disponible dans le plan
    if (user.schoolId) {
      const featureCheck = await checkFeatureAccess(user.schoolId, 'messaging')
      if (!featureCheck.allowed) {
        return NextResponse.json({ 
          error: 'Fonctionnalité non disponible',
          message: featureCheck.error,
          upgradeRequired: true
        }, { status: 403 })
      }
    }

    const body = await req.json()
    const { participantIds, subject, type = 'DIRECT', initialMessage } = body

    if (!participantIds || participantIds.length === 0) {
      return NextResponse.json(
        { error: 'Au moins un participant est requis' },
        { status: 400 }
      )
    }

    // Vérifier si une conversation directe existe déjà
    if (type === 'DIRECT' && participantIds.length === 1) {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          participants: {
            every: {
              userId: { in: [user.id, participantIds[0]] }
            }
          }
        },
        include: {
          participants: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })

      if (existingConversation && (existingConversation as any).participants.length === 2) {
        return NextResponse.json(existingConversation)
      }
    }

    // Créer la conversation
    const conversation = await prisma.conversation.create({
      data: {
        schoolId: user.schoolId || '',
        subject,
        type,
        participants: {
          create: [
            { userId: user.id },
            ...participantIds.map((id: string) => ({ userId: id }))
          ]
        },
        ...(initialMessage && {
          messages: {
            create: {
              senderId: user.id,
              senderName: user.name,
              senderRole: user.role,
              content: initialMessage
            }
          }
        })
      },
      include: {
        participants: true,
        messages: true
      }
    })

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de la conversation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la conversation' },
      { status: 500 }
    )
  }
}
