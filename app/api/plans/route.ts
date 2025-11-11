import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/plans
 * Récupérer tous les plans actifs (API publique)
 */
export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { price: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        price: true,
        interval: true,
        maxStudents: true,
        maxTeachers: true,
        features: true,
        isPopular: true,
        isActive: true
      }
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Erreur récupération plans:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
