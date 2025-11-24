import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import { vitepay } from '@/lib/vitepay/client'
import prisma from '@/lib/prisma'
import { checkFeatureAccess } from '@/lib/check-plan-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 Début création paiement VitePay')
    
    const user = await getAuthUser()
    
    if (!user || (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { planId, schoolId } = await request.json()
    console.log('📦 Données reçues:', { planId, schoolId })

    // Vérifier la configuration VitePay
    console.log('🔧 Config VitePay:', {
      hasApiKey: !!process.env.VITEPAY_API_KEY,
      hasApiSecret: !!process.env.VITEPAY_API_SECRET,
      mode: process.env.VITEPAY_MODE,
      baseUrl: process.env.VITEPAY_BASE_URL
    })

    // Vérifier si les paiements en ligne sont disponibles dans le plan
    const featureCheck = await checkFeatureAccess(schoolId, 'onlinePayments')
    if (!featureCheck.allowed) {
      return NextResponse.json({ 
        error: 'Fonctionnalité non disponible',
        message: featureCheck.error,
        upgradeRequired: true
      }, { status: 403 })
    }

    // Récupérer le plan et l'école
    const [plan, school] = await Promise.all([
      prisma.plan.findUnique({ where: { id: planId } }),
      prisma.school.findUnique({ 
        where: { id: schoolId },
        include: { subscription: true }
      })
    ])

    if (!plan || !school) {
      return NextResponse.json(
        { error: 'Plan ou école introuvable' },
        { status: 404 }
      )
    }

    // Générer un ID de commande unique
    const orderId = `SUB-${school.id}-${Date.now()}`
    // Utiliser NEXT_PUBLIC_BASE_URL en priorité pour la cohérence
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    
    console.log('🌐 URLs de callback:', {
      baseUrl,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      returnUrl: `${baseUrl}/admin/${schoolId}/subscription?status=success&order_id=${orderId}`,
      callbackUrl: `${baseUrl}/api/vitepay/webhook`
    })

    // Créer le paiement avec VitePay selon leur documentation
    const paymentResponse = await vitepay.createPayment({
      orderId,
      amount: Number(plan.price), // Montant en francs (sera converti en centimes par le client)
      description: `Abonnement ${plan.name} - ${school.name}`,
      email: school.email || user.email,
      returnUrl: `${baseUrl}/admin/${schoolId}/subscription?status=success&order_id=${orderId}`,
      declineUrl: `${baseUrl}/admin/${schoolId}/subscription?status=declined&order_id=${orderId}`,
      cancelUrl: `${baseUrl}/admin/${schoolId}/subscription?status=cancelled&order_id=${orderId}`,
      callbackUrl: `${baseUrl}/api/vitepay/webhook`,
      buyerIpAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    })

    console.log('✅ Réponse VitePay:', paymentResponse)

    // Note: Pour les paiements d'abonnement école, on pourrait créer un modèle séparé
    // Pour l'instant, on stocke l'orderId dans les métadonnées de la souscription

    return NextResponse.json({
      success: true,
      orderId,
      redirectUrl: paymentResponse.redirect_url,
    })
  } catch (error) {
    console.error('Erreur création paiement VitePay:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la création du paiement' },
      { status: 500 }
    )
  }
}
