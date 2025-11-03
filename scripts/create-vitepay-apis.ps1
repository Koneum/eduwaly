# Script PowerShell pour créer les APIs Vitepay et webhooks

Write-Host "🚀 Création des APIs Vitepay..." -ForegroundColor Cyan
Write-Host ""

# Créer le dossier API vitepay
New-Item -ItemType Directory -Force -Path "app/api/vitepay" | Out-Null

# 1. API Webhook Vitepay
Write-Host "  → app/api/vitepay/webhook/route.ts" -ForegroundColor Gray
@'
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
'@ | Out-File -FilePath "app/api/vitepay/webhook/route.ts" -Encoding UTF8

# 2. API Créer paiement
Write-Host "  → app/api/vitepay/create-payment/route.ts" -ForegroundColor Gray
@'
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
'@ | Out-File -FilePath "app/api/vitepay/create-payment/route.ts" -Encoding UTF8

# 3. API Vérifier paiement
Write-Host "  → app/api/vitepay/verify-payment/[id]/route.ts" -ForegroundColor Gray
New-Item -ItemType Directory -Force -Path "app/api/vitepay/verify-payment/[id]" | Out-Null
@'
import { NextRequest, NextResponse } from 'next/server'
import { vitepay } from '@/lib/vitepay/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const payment = await vitepay.getPayment(id)

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        reference: payment.reference
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
'@ | Out-File -FilePath "app/api/vitepay/verify-payment/[id]/route.ts" -Encoding UTF8

Write-Host ""
Write-Host "✅ APIs Vitepay créées avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 APIs créées:" -ForegroundColor Yellow
Write-Host "  • POST /api/vitepay/webhook - Recevoir les webhooks" -ForegroundColor Gray
Write-Host "  • POST /api/vitepay/create-payment - Créer un paiement" -ForegroundColor Gray
Write-Host "  • GET /api/vitepay/verify-payment/[id] - Vérifier un paiement" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 Configurer le webhook dans Vitepay:" -ForegroundColor Yellow
Write-Host "  URL: https://votre-domaine.com/api/vitepay/webhook" -ForegroundColor Gray
Write-Host ""
