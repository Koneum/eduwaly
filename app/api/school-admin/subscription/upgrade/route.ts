import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import { vitepay } from '@/lib/vitepay/client'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Prix des plans en FCFA
const PLAN_PRICES = {
  STARTER: 5000,
  PROFESSIONAL: 12500,
  BUSINESS: 25000,
  ENTERPRISE: 0, // Sur devis
}

/**
 * POST /api/school-admin/subscription/upgrade
 * Créer un paiement VitePay pour upgrade de plan
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { planName } = await req.json()

    if (!planName || !['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'].includes(planName)) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    // Vérifier que l'école existe
    const school = await prisma.school.findUnique({
      where: { id: user.schoolId! },
      include: {
        subscription: {
          include: { plan: true }
        }
      }
    })

    if (!school) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }


    // Si ENTERPRISE, rediriger vers formulaire de contact
    if (planName === 'ENTERPRISE') {
      return NextResponse.json({
        message: 'Veuillez nous contacter pour un devis Enterprise',
        contactRequired: true,
      }, { status: 400 })
    }

    // Pour STARTER, PROFESSIONAL et BUSINESS, créer un paiement VitePay
    const price = PLAN_PRICES[planName as keyof typeof PLAN_PRICES]
    
    // Créer ou récupérer le plan
    let subscriptionPlan = await prisma.plan.findFirst({
      where: { name: planName }
    })
    
    if (!subscriptionPlan) {
      subscriptionPlan = await prisma.plan.create({
        data: {
          name: planName,
          description: planName === 'STARTER' ? 'Pour les petites écoles' : planName === 'PROFESSIONAL' ? 'Pour les écoles en croissance' : 'Pour les grandes institutions',
          price,
          interval: 'monthly',
          maxStudents: planName === 'STARTER' ? 100 : planName === 'PROFESSIONAL' ? 500 : 2000,
          maxTeachers: planName === 'STARTER' ? 10 : planName === 'PROFESSIONAL' ? 50 : 200,
          features: JSON.stringify([
            planName === 'STARTER' ? 'Gestion basique' : planName === 'PROFESSIONAL' ? 'Messagerie + Devoirs' : 'Paiements en ligne + API',
            `${planName === 'STARTER' ? '100' : planName === 'PROFESSIONAL' ? '500' : '2000'} étudiants max`,
            `${planName === 'STARTER' ? '10' : planName === 'PROFESSIONAL' ? '50' : '200'} enseignants max`
          ]),
          isActive: true,
        }
      })
    }

    // Créer le paiement VitePay
    const orderId = `SUB-${school.id}-${planName}-${Date.now()}`
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const paymentResult = await vitepay.createPayment({
      amount: price,
      orderId,
      description: `Abonnement ${planName} - ${school.name}`,
      email: user.email || 'admin@schooly.app',
      returnUrl: `${baseUrl}/admin/${school.id}/subscription?payment=success`,
      declineUrl: `${baseUrl}/admin/${school.id}/subscription?payment=declined`,
      cancelUrl: `${baseUrl}/admin/${school.id}/subscription?payment=cancelled`,
      callbackUrl: `${baseUrl}/api/vitepay/webhook`,
    })

    if (!paymentResult.redirect_url) {
      console.error('Erreur création paiement VitePay: Pas d\'URL de redirection')
      return NextResponse.json(
        { error: 'Erreur lors de la création du paiement' },
        { status: 500 }
      )
    }

    // Enregistrer la demande d'upgrade en attente
    await prisma.subscription.upsert({
      where: { schoolId: school.id },
      create: {
        schoolId: school.id,
        planId: subscriptionPlan.id,
        status: 'TRIAL',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      },
      update: {
        planId: subscriptionPlan.id,
        status: 'TRIAL',
      },
    })

    // Retourner l'URL de paiement VitePay
    return NextResponse.json({
      success: true,
      paymentUrl: paymentResult.redirect_url,
      orderId,
      amount: price,
    })
  } catch (error) {
    console.error('Erreur upgrade subscription:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'upgrade' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/school-admin/subscription/upgrade
 * Récupérer les informations de l'abonnement actuel
 */
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user || user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const school = await prisma.school.findUnique({
      where: { id: user.schoolId! },
      include: {
        subscription: {
          include: { plan: true }
        }
      }
    })

    if (!school) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    return NextResponse.json({
      currentPlan: school.subscription?.plan?.name || 'STARTER',
      status: school.subscription?.status || 'TRIAL',
      currentPeriodEnd: school.subscription?.currentPeriodEnd,
      prices: PLAN_PRICES,
    })
  } catch (error) {
    console.error('Erreur récupération subscription:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}
