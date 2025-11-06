import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Vérifier le statut d'un paiement via l'order_id
 * Note: VitePay ne fournit pas d'API de vérification directe.
 * Le statut est mis à jour via le webhook callback.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    // Extraire le schoolId de l'orderId (format: SUB-{schoolId}-{timestamp})
    const orderParts = orderId.split('-')
    if (orderParts[0] !== 'SUB' || orderParts.length < 3) {
      return NextResponse.json(
        { error: 'Format order_id invalide' },
        { status: 400 }
      )
    }

    const schoolId = orderParts[1]

    // Vérifier le statut de l'abonnement
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: { subscription: true }
    })

    if (!school?.subscription) {
      return NextResponse.json(
        { error: 'Abonnement introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      orderId,
      subscription: {
        status: school.subscription.status,
        currentPeriodEnd: school.subscription.currentPeriodEnd,
      }
    })
  } catch (error) {
    console.error('Erreur vérification paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du paiement' },
      { status: 500 }
    )
  }
}
