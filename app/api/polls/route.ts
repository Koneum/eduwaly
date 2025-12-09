import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// GET - Récupérer les sondages disponibles pour l'utilisateur connecté
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Trouver le schoolId de l'utilisateur
    let schoolId = user.schoolId

    // Si c'est un étudiant ou parent, récupérer via leurs relations
    if (!schoolId) {
      if (user.role === 'STUDENT') {
        const student = await prisma.student.findFirst({
          where: { userId: user.id },
          select: { schoolId: true, niveau: true }
        })
        schoolId = student?.schoolId || null
      } else if (user.role === 'PARENT') {
        const parent = await prisma.parent.findFirst({
          where: { userId: user.id },
          include: {
            students: {
              select: { schoolId: true }
            }
          }
        })
        schoolId = parent?.students[0]?.schoolId || null
      }
    }

    if (!schoolId) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    const now = new Date()

    // Récupérer les sondages actifs pour le rôle de l'utilisateur
    const polls = await prisma.poll.findMany({
      where: {
        schoolId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      },
      include: {
        options: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { responses: true }
            }
          }
        },
        responses: {
          where: {
            userId: user.id
          },
          select: {
            optionId: true
          }
        },
        _count: {
          select: { responses: true }
        }
      },
      orderBy: { startDate: 'desc' }
    })

    // Filtrer par rôle et ajouter les statistiques
    const filteredPolls = polls.filter(poll => {
      const targetRoles = JSON.parse(poll.targetRoles)
      return targetRoles.includes(user.role) || targetRoles.includes('ALL')
    }).map(poll => {
      const totalResponses = poll._count.responses
      const hasVoted = poll.responses.length > 0
      const userVotes = poll.responses.map(r => r.optionId)

      const optionsWithStats = poll.options.map(option => ({
        id: option.id,
        text: option.text,
        order: option.order,
        responseCount: option._count.responses,
        percentage: totalResponses > 0 
          ? Math.round((option._count.responses / totalResponses) * 100) 
          : 0,
        isSelected: userVotes.includes(option.id)
      }))

      return {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        startDate: poll.startDate,
        endDate: poll.endDate,
        isAnonymous: poll.isAnonymous,
        allowMultiple: poll.allowMultiple,
        totalResponses,
        hasVoted,
        userVotes,
        options: optionsWithStats
      }
    })

    return NextResponse.json({ polls: filteredPolls })
  } catch (error) {
    console.error('Error fetching polls for user:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
