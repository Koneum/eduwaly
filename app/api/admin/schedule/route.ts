import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/schedule
 * Créer un nouvel emploi du temps
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
    const {
      schoolId,
      moduleId,
      enseignantId,
      niveau,
      salle,
      heureDebut,
      heureFin,
      joursCours,
      vh,
      semestre,
      dateDebut,
      dateFin,
    } = body

    // Validation avec log détaillé
    const missingFields = []
    if (!schoolId) missingFields.push('schoolId')
    if (!moduleId) missingFields.push('moduleId')
    if (!enseignantId) missingFields.push('enseignantId')
    if (!niveau) missingFields.push('niveau')
    if (!salle) missingFields.push('salle')
    if (!heureDebut) missingFields.push('heureDebut')
    if (!heureFin) missingFields.push('heureFin')
    if (!joursCours) missingFields.push('joursCours')
    if (!Array.isArray(joursCours)) missingFields.push('joursCours (not array)')
    if (!semestre) missingFields.push('semestre')
    
    if (missingFields.length > 0) {
      console.error('Champs manquants:', missingFields, 'Body reçu:', body)
      return NextResponse.json(
        { error: `Champs manquants: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Vérifier que l'école appartient à l'utilisateur
    if (schoolId !== user.schoolId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Vous ne pouvez créer des emplois du temps que pour votre école' },
        { status: 403 }
      )
    }

    // Vérifier que le module existe et récupérer sa filière
    const moduleRecord = await prisma.module.findFirst({
      where: {
        id: moduleId,
        schoolId: schoolId,
      },
    })

    if (!moduleRecord) {
      return NextResponse.json({ error: 'Module non trouvé' }, { status: 404 })
    }

    // Pour les UE communes, pas besoin de filière
    // Sinon, utiliser la filière du module
    const filiereId = moduleRecord.isUeCommune ? null : moduleRecord.filiereId

    // Vérifier que l'enseignant existe
    const enseignant = await prisma.enseignant.findFirst({
      where: {
        id: enseignantId,
        schoolId: schoolId,
      },
    })

    if (!enseignant) {
      return NextResponse.json({ error: 'Enseignant non trouvé' }, { status: 404 })
    }

    // Vérifier que la filière existe (si elle est définie)
    if (filiereId) {
      const filiere = await prisma.filiere.findFirst({
        where: {
          id: filiereId,
          schoolId: schoolId,
        },
      })

      if (!filiere) {
        return NextResponse.json({ error: 'Filière non trouvée' }, { status: 404 })
      }
    }

    // Vérifier les conflits d'horaires pour l'enseignant
    const conflits = await prisma.emploiDuTemps.findMany({
      where: {
        enseignantId,
        schoolId,
        OR: [
          {
            AND: [
              { heureDebut: { lte: heureDebut } },
              { heureFin: { gt: heureDebut } },
            ],
          },
          {
            AND: [
              { heureDebut: { lt: heureFin } },
              { heureFin: { gte: heureFin } },
            ],
          },
        ],
      },
    })

    // Vérifier si un conflit existe pour les mêmes jours
    const hasConflict = conflits.some((emploi: { joursCours?: string | null }) => {
      const emploiJours = JSON.parse(emploi.joursCours || '[]')
      return joursCours.some((jour: string) => emploiJours.includes(jour))
    })

    if (hasConflict) {
      return NextResponse.json(
        { error: 'Conflit d\'horaire: l\'enseignant a déjà un cours à ces horaires' },
        { status: 400 }
      )
    }

    // Créer l'emploi du temps
    const emploi = await prisma.emploiDuTemps.create({
      data: {
        titre: `${moduleRecord.nom} - ${niveau}`,
        schoolId,
        moduleId,
        enseignantId,
        filiereId,
        niveau,
        salle,
        heureDebut,
        heureFin,
        joursCours: JSON.stringify(joursCours),
        vh: vh || moduleRecord.vh,
        semestre: semestre || 'S1',
        dateDebut: dateDebut ? new Date(dateDebut) : new Date(),
        dateFin: dateFin ? new Date(dateFin) : new Date(new Date().setMonth(new Date().getMonth() + 6)),
      },
      include: {
        module: true,
        enseignant: true,
        filiere: true,
      },
    })

    return NextResponse.json(emploi)
  } catch (error) {
    console.error('Erreur lors de la création de l\'emploi du temps:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'emploi du temps' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/schedule
 * Supprimer un emploi du temps
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est admin
    if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    // Vérifier que l'emploi du temps appartient à l'école
    const emploi = await prisma.emploiDuTemps.findUnique({
      where: { id },
    })

    if (!emploi) {
      return NextResponse.json({ error: 'Emploi du temps non trouvé' }, { status: 404 })
    }

    if (emploi.schoolId !== user.schoolId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Vous ne pouvez supprimer que les emplois du temps de votre école' },
        { status: 403 }
      )
    }

    await prisma.emploiDuTemps.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}