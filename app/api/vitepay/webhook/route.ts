import { NextRequest, NextResponse } from 'next/server'
import { vitepay } from '@/lib/vitepay/client'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-vitepay-signature') || ''
    const payload = await request.text()

    // Vérifier la signature du webhook
    if (!vitepay.verifyWebhookSignature(payload, signature)) {
      console.error('❌ Signature webhook invalide')
      return NextResponse.json(
        { error: 'Signature invalide' },
        { status: 401 }
      )
    }

    const event = JSON.parse(payload)
    console.log('📨 Webhook Vitepay reçu:', event.type)

    switch (event.type) {
      case 'payment.completed': {
        // Paiement réussi
        const payment = event.data
        
        // Mettre à jour l'abonnement
        await prisma.subscription.updateMany({
          where: {
            vitepaySubscriptionId: payment.metadata?.subscriptionId
          },
          data: {
            status: 'ACTIVE',
            currentPeriodEnd: new Date(payment.metadata?.periodEnd)
          }
        })

        console.log('✅ Paiement traité:', payment.id)
        break
      }

      case 'payment.failed': {
        // Paiement échoué
        const payment = event.data
        
        await prisma.subscription.updateMany({
          where: {
            vitepaySubscriptionId: payment.metadata?.subscriptionId
          },
          data: {
            status: 'PAST_DUE'
          }
        })

        console.log('⚠️ Paiement échoué:', payment.id)
        break
      }

      case 'subscription.cancelled': {
        // Abonnement annulé
        const subscription = event.data
        
        await prisma.subscription.updateMany({
          where: {
            vitepaySubscriptionId: subscription.id
          },
          data: {
            status: 'CANCELED'
          }
        })

        console.log('🚫 Abonnement annulé:', subscription.id)
        break
      }

      default:
        console.log('ℹ️ Type d\'événement non géré:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Erreur webhook Vitepay:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
