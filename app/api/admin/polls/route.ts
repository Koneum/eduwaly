import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// GET - Récupérer tous les sondages de l'école
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'active', 'ended', 'all'

    const now = new Date()
    let whereClause: Record<string, unknown> = { schoolId: user.schoolId }

    if (status === 'active') {
      whereClause = {
        ...whereClause,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      }
    } else if (status === 'ended') {
      whereClause = {
        ...whereClause,
        OR: [
          { endDate: { lt: now } },
          { isActive: false }
        ]
      }
    }

    const polls = await prisma.poll.findMany({
      where: whereClause,
      include: {
        options: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { responses: true }
            }
          }
        },
        _count: {
          select: { responses: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Ajouter les statistiques de participation
    const pollsWithStats = polls.map(poll => {
      const totalResponses = poll._count.responses
      const optionsWithPercentage = poll.options.map(option => ({
        ...option,
        responseCount: option._count.responses,
        percentage: totalResponses > 0 
          ? Math.round((option._count.responses / totalResponses) * 100) 
          : 0
      }))

      return {
        ...poll,
        totalResponses,
        options: optionsWithPercentage
      }
    })

    return NextResponse.json({ polls: pollsWithStats })
  } catch (error) {
    console.error('Error fetching polls:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer un nouveau sondage
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      targetRoles,
      targetNiveaux,
      startDate,
      endDate,
      isAnonymous,
      allowMultiple,
      options
    } = body

    // Validation
    if (!title || !startDate || !endDate) {
      return NextResponse.json({ error: 'Titre et dates requis' }, { status: 400 })
    }

    if (!options || options.length < 2) {
      return NextResponse.json({ error: 'Au moins 2 options sont requises' }, { status: 400 })
    }

    const poll = await prisma.poll.create({
      data: {
        title,
        description,
        schoolId: user.schoolId,
        targetRoles: JSON.stringify(targetRoles || ['STUDENT', 'PARENT']),
        targetNiveaux: targetNiveaux ? JSON.stringify(targetNiveaux) : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true,
        isAnonymous: isAnonymous || false,
        allowMultiple: allowMultiple || false,
        createdBy: user.id,
        options: {
          create: options.map((text: string, index: number) => ({
            text,
            order: index
          }))
        }
      },
      include: {
        options: {
          orderBy: { order: 'asc' }
        }
      }
    })

    return NextResponse.json({ poll }, { status: 201 })
  } catch (error) {
    console.error('Error creating poll:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
