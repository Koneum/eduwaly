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

    // ✅ OPTIMISÉ: Charger conversations avec select précis + _count
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: user.id
          }
        }
      },
      select: {
        id: true,
        subject: true,
        type: true,
        schoolId: true,
        updatedAt: true,
        createdAt: true,
        participants: {
          where: {
            userId: { not: user.id }
          },
          select: {
            userId: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            senderName: true,
            isDeleted: true
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: user.id },
                readBy: { not: { contains: user.id } }
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // ✅ Charger TOUS les users en 1 seule requête (au lieu de N requêtes)
    const allUserIds = conversations.flatMap(c => 
      c.participants.map(p => p.userId)
    )
    
    const allUsers = await prisma.user.findMany({
      where: { id: { in: allUserIds } },
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

    // ✅ Mapper en mémoire (pas de requêtes supplémentaires)
    const enrichedConversations = conversations.map(conv => {
      const otherUsers = conv.participants.map(p => {
        const user = allUsers.find(u => u.id === p.userId)
        return user ? {
          id: user.id,
          name: user.name,
          email: user.email ?? null,
          role: user.role,
          avatar: user.avatar ?? null,
          schoolName: user.role === 'SCHOOL_ADMIN' && user.school?.name 
            ? user.school.name 
            : null,
        } : null
      }).filter(Boolean)

      return {
        id: conv.id,
        subject: conv.subject,
        type: conv.type,
        schoolId: conv.schoolId,
        updatedAt: conv.updatedAt,
        createdAt: conv.createdAt,
        otherUsers,
        lastMessage: conv.messages[0] || null,
        unreadCount: conv._count.messages
      }
    })

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
