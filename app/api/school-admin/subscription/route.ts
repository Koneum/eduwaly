import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// GET - Récupérer l'abonnement de l'école
export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const schoolId = user.role === 'SUPER_ADMIN' ? undefined : user.schoolId

    if (!schoolId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    const subscription = await prisma.subscription.findFirst({
      where: schoolId ? { schoolId } : undefined,
      include: {
        plan: true,
        school: true
      }
    })

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Changer de plan (School Admin peut demander un changement)
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, schoolId: requestSchoolId } = body

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID manquant' }, { status: 400 })
    }

    // Déterminer l'école concernée
    let schoolId = user.schoolId
    if (user.role === 'SUPER_ADMIN' && requestSchoolId) {
      schoolId = requestSchoolId
    }

    if (!schoolId) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    // Vérifier que le plan existe
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan introuvable' }, { status: 404 })
    }

    // Trouver l'abonnement actuel
    const currentSubscription = await prisma.subscription.findFirst({
      where: { schoolId }
    })

    if (!currentSubscription) {
      return NextResponse.json({ error: 'Aucun abonnement trouvé' }, { status: 404 })
    }

    // Mettre à jour l'abonnement
    const subscription = await prisma.subscription.update({
      where: { id: currentSubscription.id },
      data: {
        planId,
        // Si c'est un upgrade, on active immédiatement
        status: 'ACTIVE'
      },
      include: {
        plan: true,
        school: true
      }
    })

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
