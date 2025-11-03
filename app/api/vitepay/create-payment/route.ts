import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import { vitepay } from '@/lib/vitepay/client'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    
    if (!user || (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { planId, schoolId } = await request.json()

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

    // Créer le paiement avec Vitepay
    const payment = await vitepay.createPayment({
      amount: Number(plan.price) * 100, // Convertir en centimes
      reference: `SUB-${school.id}-${Date.now()}`,
      customer: {
        name: school.name,
        email: school.email || user.email,
        phone: school.phone || ''
      },
      metadata: {
        schoolId: school.id,
        planId: plan.id,
        subscriptionId: school.subscription?.id,
        userId: user.id
      }
    })

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      paymentUrl: payment.paymentUrl,
      reference: payment.reference
    })
  } catch (error) {
    console.error('Erreur création paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du paiement' },
      { status: 500 }
    )
  }
}
