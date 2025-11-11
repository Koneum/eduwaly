import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

/**
 * GET /api/school-admin/subscription/current
 * Récupérer le plan d'abonnement actuel de l'école
 */
export async function GET() {
  try {
    const user = await getAuthUser()
    
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer l'école avec son abonnement
    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      }
    })

    if (!school) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    // Si pas d'abonnement, retourner le plan STARTER par défaut
    if (!school.subscription || !school.subscription.plan) {
      return NextResponse.json({
        planName: 'STARTER',
        planDisplayName: 'Essai Gratuit',
        status: 'trial',
        maxStudents: 100,
        maxTeachers: 10,
        features: {
          messaging: false,
          onlinePayments: false,
          advancedReports: false,
          api: false
        }
      })
    }

    const subscription = school.subscription
    const plan = subscription.plan

    // Calculer le statut
    const now = new Date()
    let status = 'active'
    
    if (subscription.status === 'TRIAL') {
      status = 'trial'
    } else if (subscription.status === 'CANCELED') {
      status = 'cancelled'
    } else if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < now) {
      status = 'expired'
    }

    return NextResponse.json({
      planName: plan.name,
      planDisplayName: plan.displayName,
      status,
      maxStudents: plan.maxStudents,
      maxTeachers: plan.maxTeachers,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialEndsAt: subscription.trialEndsAt,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
    })

  } catch (error) {
    console.error('Erreur récupération plan:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
