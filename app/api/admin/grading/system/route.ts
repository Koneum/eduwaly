import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/admin/grading/system
 * Mettre à jour la configuration du système de notation
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { schoolId, gradingSystem, gradingFormula } = body

    // Validation
    if (!schoolId || !gradingSystem || !gradingFormula) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Vérifier que l'admin appartient à cette école
    if (user.schoolId !== schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Mettre à jour l'école
    const school = await prisma.school.update({
      where: { id: schoolId },
      data: {
        gradingSystem,
        gradingFormula
      }
    })

    return NextResponse.json({ 
      message: 'Configuration mise à jour',
      school 
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    )
  }
}
