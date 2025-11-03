import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/salles
 * Récupérer les salles utilisées dans l'école
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const schoolId = searchParams.get('schoolId')

    if (!schoolId) {
      return NextResponse.json({ error: 'schoolId requis' }, { status: 400 })
    }

    // Récupérer toutes les salles uniques utilisées dans les emplois du temps
    const emplois = await prisma.emploiDuTemps.findMany({
      where: {
        schoolId: schoolId,
      },
      select: {
        salle: true,
      },
      distinct: ['salle'],
    })

    const salles = emplois.map((e) => ({ nom: e.salle }))

    return NextResponse.json(salles)
  } catch (error) {
    console.error('Erreur lors de la récupération des salles:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des salles' },
      { status: 500 }
    )
  }
}
