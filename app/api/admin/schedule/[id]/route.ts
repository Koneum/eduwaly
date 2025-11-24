import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/admin/schedule/[id]
 * Modifier un emploi du temps
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est admin
    if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
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

    // Validation
    if (!schoolId || !moduleId || !enseignantId || !niveau || !salle || 
        !heureDebut || !heureFin || !joursCours || !Array.isArray(joursCours) || !semestre) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    // Vérifier que l'emploi existe
    const existingEmploi = await prisma.emploiDuTemps.findUnique({
      where: { id },
      include: { 
        module: true,
        enseignant: true,
        filiere: true
      }
    })

    if (!existingEmploi) {
      return NextResponse.json({ error: 'Emploi non trouvé' }, { status: 404 })
    }

    // Vérifier que l'école correspond
    if (existingEmploi.schoolId !== user.schoolId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Action non autorisée pour cette école' },
        { status: 403 }
      )
    }

    // Vérifier que le module existe
    const moduleRecord = await prisma.module.findFirst({
      where: {
        id: moduleId,
        schoolId: user.schoolId,
      },
    })

    if (!moduleRecord) {
      return NextResponse.json({ error: 'Module non trouvé' }, { status: 404 })
    }

    // Utiliser la filière du module
    const filiereId = moduleRecord.filiereId

    // Vérifier que l'enseignant existe
    const enseignant = await prisma.enseignant.findFirst({
      where: {
        id: enseignantId,
        schoolId: user.schoolId,
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
          schoolId: user.schoolId,
        },
      })

      if (!filiere) {
        return NextResponse.json({ error: 'Filière non trouvée' }, { status: 404 })
      }
    }

    // Vérifier les conflits d'horaires pour l'enseignant (sauf pour l'emploi actuel)
    const conflits = await prisma.emploiDuTemps.findMany({
      where: {
        id: { not: id }, // Exclure l'emploi actuel de la vérification
        enseignantId,
        schoolId: user.schoolId,
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

    // Mettre à jour l'emploi du temps
    const updatedEmploi = await prisma.emploiDuTemps.update({
      where: { id },
      data: {
        titre: `${moduleRecord.nom} - ${niveau}`,
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
        dateDebut: dateDebut ? new Date(dateDebut) : existingEmploi.dateDebut,
        dateFin: dateFin ? new Date(dateFin) : existingEmploi.dateFin,
      },
      include: {
        module: true,
        enseignant: true,
        filiere: true,
      },
    })

    return NextResponse.json(updatedEmploi)

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'emploi du temps:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'emploi du temps' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/schedule/[id]
 * Supprimer un emploi du temps
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est admin
    if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { id } = await params

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
