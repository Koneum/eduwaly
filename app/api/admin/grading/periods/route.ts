import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/grading/periods
 * Créer une période de notation
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { schoolId, name, startDate, endDate } = body

    if (!schoolId || !name || !startDate || !endDate) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    if (user.schoolId !== schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const period = await prisma.gradingPeriod.create({
      data: {
        schoolId,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      }
    })

    return NextResponse.json(period)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }
}
