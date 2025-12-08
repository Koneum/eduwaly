import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/schedule/day
 * Récupérer l'emploi du temps pour un jour spécifique
 * 
 * Query params:
 * - date: Date ISO string
 * - schoolId: ID de l'école
 * - niveau: Niveau de l'étudiant
 * - filiereId: ID de la filière (optionnel)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get('date')
    const schoolId = searchParams.get('schoolId')
    const niveau = searchParams.get('niveau')
    const filiereId = searchParams.get('filiereId')

    if (!dateStr || !schoolId || !niveau) {
      return NextResponse.json(
        { error: 'Paramètres manquants: date, schoolId, niveau requis' },
        { status: 400 }
      )
    }

    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)

    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)

    // Nom du jour en majuscules
    const dayNames = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']
    const currentDay = dayNames[date.getDay()]

    // Récupérer l'emploi du temps
    const emploiDuTemps = await prisma.emploiDuTemps.findMany({
      where: {
        schoolId,
        niveau,
        OR: filiereId 
          ? [
              { filiereId },
              { ueCommune: true }
            ]
          : [{ ueCommune: true }],
        dateDebut: { lte: nextDay },
        dateFin: { gte: date },
        joursCours: {
          contains: currentDay
        }
      },
      include: {
        module: true,
        enseignant: true
      },
      orderBy: {
        heureDebut: 'asc'
      }
    })

    // Déterminer le statut de chaque cours
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const isToday = date.toDateString() === now.toDateString()

    const schedule = emploiDuTemps.map((cours) => {
      let status: 'current' | 'upcoming' | 'completed' = 'upcoming'
      
      if (isToday) {
        if (currentTime > cours.heureFin) {
          status = 'completed'
        } else if (currentTime >= cours.heureDebut && currentTime <= cours.heureFin) {
          status = 'current'
        }
      } else if (date < now) {
        // Jours passés
        status = 'completed'
      }
      
      return {
        id: cours.id,
        time: `${cours.heureDebut} - ${cours.heureFin}`,
        subject: cours.module.nom,
        teacher: cours.enseignant 
          ? `${cours.enseignant.titre || ''} ${cours.enseignant.prenom} ${cours.enseignant.nom}`.trim()
          : 'Non assigné',
        room: cours.salle || 'Non définie',
        status,
        type: cours.module.type
      }
    })

    return NextResponse.json({
      date: date.toISOString(),
      day: currentDay,
      schedule
    })
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'emploi du temps:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'emploi du temps' },
      { status: 500 }
    )
  }
}
