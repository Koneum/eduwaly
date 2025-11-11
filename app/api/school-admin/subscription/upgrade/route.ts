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

    const body = await req.json()
    const { planName, planId, schoolId } = body

    // Accepter soit planName soit planId
    if (!planName && !planId) {
      return NextResponse.json({ error: 'planName ou planId requis' }, { status: 400 })
    }

    if (planName && !['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'].includes(planName)) {
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
    
    // Récupérer le plan (par ID ou par nom)
    let subscriptionPlan
    if (planId) {
      subscriptionPlan = await prisma.plan.findUnique({
        where: { id: planId }
      })
    } else {
      subscriptionPlan = await prisma.plan.findFirst({
        where: { name: planName }
      })
    }
    
    if (!subscriptionPlan) {
      return NextResponse.json({ error: 'Plan non trouvé' }, { status: 404 })
    }

    // Utiliser le prix du plan de la base de données
    const price = Number(subscriptionPlan.price)

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
