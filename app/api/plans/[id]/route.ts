import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const plan = await prisma.plan.findUnique({
      where: { id },
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
        isActive: true,
        isPopular: true,
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan non trouvé' },
        { status: 404 }
      )
    }

    // Parser les features JSON
    const features = plan.features ? JSON.parse(plan.features) : []

    return NextResponse.json({
      ...plan,
      features,
    })
  } catch (error) {
    console.error('Erreur récupération plan:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du plan' },
      { status: 500 }
    )
  }
}
