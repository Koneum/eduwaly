import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// GET - Récupérer un sondage spécifique avec ses résultats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const poll = await prisma.poll.findFirst({
      where: {
        id,
        schoolId: user.schoolId
      },
      include: {
        options: {
          orderBy: { order: 'asc' },
          include: {
            responses: {
              select: {
                id: true,
                userId: true,
                createdAt: true
              }
            }
          }
        },
        responses: {
          select: {
            id: true,
            userId: true,
            optionId: true,
            createdAt: true
          }
        }
      }
    })

    if (!poll) {
      return NextResponse.json({ error: 'Sondage non trouvé' }, { status: 404 })
    }

    // Calculer les statistiques
    const totalResponses = poll.responses.length
    const uniqueRespondents = new Set(poll.responses.map(r => r.userId)).size

    const optionsWithStats = poll.options.map(option => ({
      id: option.id,
      text: option.text,
      order: option.order,
      responseCount: option.responses.length,
      percentage: totalResponses > 0 
        ? Math.round((option.responses.length / totalResponses) * 100) 
        : 0
    }))

    return NextResponse.json({
      poll: {
        ...poll,
        options: optionsWithStats,
        totalResponses,
        uniqueRespondents
      }
    })
  } catch (error) {
    console.error('Error fetching poll:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour un sondage
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que le sondage appartient à l'école
    const existingPoll = await prisma.poll.findFirst({
      where: {
        id,
        schoolId: user.schoolId
      },
      include: {
        _count: { select: { responses: true } }
      }
    })

    if (!existingPoll) {
      return NextResponse.json({ error: 'Sondage non trouvé' }, { status: 404 })
    }

    const body = await request.json()
    const {
      title,
      description,
      targetRoles,
      targetNiveaux,
      startDate,
      endDate,
      isActive,
      isAnonymous,
      allowMultiple
    } = body

    // Si le sondage a déjà des réponses, on ne peut modifier que certains champs
    const hasResponses = existingPoll._count.responses > 0

    const updateData: Record<string, unknown> = {}

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.isActive = isActive
    
    // Ces champs ne peuvent être modifiés que si pas de réponses
    if (!hasResponses) {
      if (targetRoles !== undefined) updateData.targetRoles = JSON.stringify(targetRoles)
      if (targetNiveaux !== undefined) updateData.targetNiveaux = targetNiveaux ? JSON.stringify(targetNiveaux) : null
      if (startDate !== undefined) updateData.startDate = new Date(startDate)
      if (endDate !== undefined) updateData.endDate = new Date(endDate)
      if (isAnonymous !== undefined) updateData.isAnonymous = isAnonymous
      if (allowMultiple !== undefined) updateData.allowMultiple = allowMultiple
    }

    const poll = await prisma.poll.update({
      where: { id },
      data: updateData,
      include: {
        options: {
          orderBy: { order: 'asc' }
        }
      }
    })

    return NextResponse.json({ 
      poll,
      warning: hasResponses ? 'Certains champs n\'ont pas été modifiés car le sondage a déjà des réponses' : undefined
    })
  } catch (error) {
    console.error('Error updating poll:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un sondage
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que le sondage appartient à l'école
    const existingPoll = await prisma.poll.findFirst({
      where: {
        id,
        schoolId: user.schoolId
      }
    })

    if (!existingPoll) {
      return NextResponse.json({ error: 'Sondage non trouvé' }, { status: 404 })
    }

    // Supprimer le sondage (cascade supprime options et réponses)
    await prisma.poll.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting poll:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
