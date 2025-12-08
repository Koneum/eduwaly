import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/calendar/events
 * Récupérer les événements du calendrier
 * 
 * Query params:
 * - schoolId: ID de l'école
 * - startDate: Date de début (optionnel)
 * - endDate: Date de fin (optionnel)
 * - role: Rôle pour filtrer (optionnel)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const schoolId = searchParams.get('schoolId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!schoolId) {
      return NextResponse.json({ error: 'schoolId requis' }, { status: 400 })
    }

    const whereClause: {
      schoolId: string
      startDate?: { gte: Date }
      endDate?: { lte: Date }
    } = {
      schoolId,
    }

    // Filtrer par date si spécifié
    if (startDate) {
      whereClause.startDate = { gte: new Date(startDate) }
    }
    if (endDate) {
      whereClause.endDate = { lte: new Date(endDate) }
    }

    const events = await prisma.calendarEvent.findMany({
      where: whereClause,
      orderBy: { startDate: 'asc' }
    })

    // Filtrer par rôle de l'utilisateur
    const filteredEvents = events.filter(event => {
      try {
        const targetRoles = JSON.parse(event.targetRoles)
        if (targetRoles.length === 0) return true // Pas de restriction
        return targetRoles.includes(user.role)
      } catch {
        return true
      }
    })

    return NextResponse.json({ events: filteredEvents })
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des événements' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/calendar/events
 * Créer un nouvel événement (admin seulement)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Seuls les admins peuvent créer des événements
    if (!['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await req.json()
    const { 
      title, 
      description, 
      startDate, 
      endDate, 
      allDay, 
      type, 
      targetRoles, 
      targetNiveaux,
      targetFilieres,
      schoolId 
    } = body

    if (!title || !startDate || !type || !schoolId) {
      return NextResponse.json(
        { error: 'Champs requis: title, startDate, type, schoolId' },
        { status: 400 }
      )
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        allDay: allDay || false,
        type,
        targetRoles: JSON.stringify(targetRoles || []),
        targetNiveaux: targetNiveaux ? JSON.stringify(targetNiveaux) : null,
        targetFilieres: targetFilieres ? JSON.stringify(targetFilieres) : null,
        schoolId,
        createdBy: user.id
      }
    })

    return NextResponse.json({ success: true, event }, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'événement' },
      { status: 500 }
    )
  }
}
