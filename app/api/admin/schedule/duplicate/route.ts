import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/schedule/duplicate
 * Dupliquer un emploi du temps existant
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est admin
    if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await req.json()
    const { emploiId } = body

    if (!emploiId) {
      return NextResponse.json({ error: 'ID de l\'emploi requis' }, { status: 400 })
    }

    // Récupérer l'emploi existant
    const existingEmploi = await prisma.emploiDuTemps.findUnique({
      where: { id: emploiId },
      include: {
        module: true,
        enseignant: true,
        filiere: true,
      },
    })

    if (!existingEmploi) {
      return NextResponse.json({ error: 'Emploi non trouvé' }, { status: 404 })
    }

    // Vérifier que l'emploi appartient à l'école de l'utilisateur
    if (existingEmploi.schoolId !== user.schoolId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Action non autorisée pour cette école' },
        { status: 403 }
      )
    }

    // Créer une copie de l'emploi avec un nouveau titre
    const duplicatedEmploi = await prisma.emploiDuTemps.create({
      data: {
        titre: `${existingEmploi.module.nom} - ${existingEmploi.niveau} (Copie)`,
        schoolId: existingEmploi.schoolId,
        moduleId: existingEmploi.moduleId,
        enseignantId: existingEmploi.enseignantId,
        filiereId: existingEmploi.filiereId,
        niveau: existingEmploi.niveau,
        salle: existingEmploi.salle,
        heureDebut: existingEmploi.heureDebut,
        heureFin: existingEmploi.heureFin,
        joursCours: existingEmploi.joursCours,
        vh: existingEmploi.vh,
        semestre: existingEmploi.semestre,
        dateDebut: existingEmploi.dateDebut,
        dateFin: existingEmploi.dateFin,
      },
      include: {
        module: true,
        enseignant: true,
        filiere: true,
      },
    })

    return NextResponse.json(duplicatedEmploi)
  } catch (error) {
    console.error('Erreur lors de la duplication de l\'emploi du temps:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la duplication de l\'emploi du temps' },
      { status: 500 }
    )
  }
}