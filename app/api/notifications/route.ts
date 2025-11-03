import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// GET - Récupérer les notifications de l'utilisateur
export async function GET(req: NextRequest) {
  try {
    let user
    try {
      user = await getAuthUser()
    } catch (authError) {
      console.error('Erreur getAuthUser:', authError)
      return NextResponse.json({ error: 'Erreur d\'authentification' }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        ...(unreadOnly && { isRead: false })
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false
      }
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des notifications' },
      { status: 500 }
    )
  }
}

// POST - Créer une notification
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Seuls les admins peuvent créer des notifications
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const {
      userIds,
      title,
      message,
      type = 'INFO',
      category = 'ANNOUNCEMENT',
      actionUrl,
      actionLabel,
      metadata = {}
    } = body

    if (!userIds || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Au moins un destinataire est requis' },
        { status: 400 }
      )
    }

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Le titre et le message sont requis' },
        { status: 400 }
      )
    }

    // Créer les notifications
    const notifications = await prisma.notification.createMany({
      data: userIds.map((userId: string) => ({
        userId,
        schoolId: user.schoolId,
        title,
        message,
        type,
        category,
        actionUrl,
        actionLabel,
        metadata: JSON.stringify(metadata)
      }))
    })

    return NextResponse.json(notifications, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la notification' },
      { status: 500 }
    )
  }
}

// PUT - Marquer les notifications comme lues
export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { notificationIds, markAll = false } = body

    if (markAll) {
      // Marquer toutes les notifications comme lues
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })
    } else if (notificationIds && notificationIds.length > 0) {
      // Marquer les notifications spécifiques comme lues
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la mise à jour des notifications:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des notifications' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer des notifications
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const notificationIds = searchParams.get('ids')?.split(',') || []

    if (notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'Aucune notification à supprimer' },
        { status: 400 }
      )
    }

    await prisma.notification.deleteMany({
      where: {
        id: { in: notificationIds },
        userId: user.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la suppression des notifications:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression des notifications' },
      { status: 500 }
    )
  }
}
