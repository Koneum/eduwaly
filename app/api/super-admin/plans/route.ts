import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

// GET - Récupérer tous les plans
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const plans = await prisma.plan.findMany({
      orderBy: { price: 'asc' }
    })

    // Parser le champ features pour chaque plan
    const plansWithParsedFeatures = plans.map(plan => ({
      ...plan,
      features: plan.features ? JSON.parse(plan.features) : []
    }))

    return NextResponse.json({ plans: plansWithParsedFeatures })
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer un nouveau plan
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      displayName,
      price,
      interval,
      description,
      features,
      maxStudents,
      maxTeachers,
      isActive,
      isPopular
    } = body

    const plan = await prisma.plan.create({
      data: {
        name,
        displayName,
        price,
        interval,
        description,
        features: Array.isArray(features) ? JSON.stringify(features) : features,
        maxStudents,
        maxTeachers,
        isActive,
        isPopular
      }
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Error creating plan:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
