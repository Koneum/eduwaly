import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/admin/grading/periods/[id]
 * Modifier une période de notation
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, startDate, endDate } = body

    const period = await prisma.gradingPeriod.update({
      where: { id },
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      }
    })

    return NextResponse.json(period)
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur lors de la modification' }, { status: 500 })
  }
}
