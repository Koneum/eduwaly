import { NextRequest } from 'next/server'
import { vitepay } from '@/lib/vitepay/client'
import type { VitepayCallbackData } from '@/lib/vitepay/client'
import prisma from '@/lib/prisma'
import { handleCorsOptions, corsJsonResponse } from '@/lib/cors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Webhook VitePay - Reçoit les callbacks serveur-à-serveur
 * Documentation: https://api.vitepay.com/developers section 5
 * 
 * Support CORS pour les requêtes cross-origin de VitePay
 */

// Gérer les requêtes OPTIONS (CORS preflight)
export async function OPTIONS() {
  return handleCorsOptions()
}

export async function POST(request: NextRequest) {
  try {
    // VitePay envoie les données en form-urlencoded
    const formData = await request.formData()
    
    const callbackData: VitepayCallbackData = {
      order_id: formData.get('order_id') as string,
      amount_100: formData.get('amount_100') as string,
      currency_code: formData.get('currency_code') as string,
      authenticity: formData.get('authenticity') as string,
      success: formData.get('success') as string | undefined,
      failure: formData.get('failure') as string | undefined,
      sandbox: formData.get('sandbox') as string | undefined,
    }

    console.log('📨 Callback VitePay reçu:', {
      orderId: callbackData.order_id,
      success: callbackData.success,
      failure: callbackData.failure,
      sandbox: callbackData.sandbox
    })

    // Vérifier l'authenticité et traiter le callback
    const result = vitepay.handleCallback(callbackData)

    if (!result.isValid) {
      console.error('❌ Signature invalide pour order_id:', callbackData.order_id)
      return corsJsonResponse(result.response)
    }

    // Extraire les informations de l'order_id (format: SUB-{schoolId}-{timestamp})
    const orderParts = callbackData.order_id.split('-')
    if (orderParts[0] === 'SUB' && orderParts.length >= 3) {
      const schoolId = orderParts[1]
      
      if (result.isSuccess) {
        // Paiement réussi - Activer l'abonnement
        const school = await prisma.school.findUnique({
          where: { id: schoolId },
          include: { subscription: true }
        })

        if (school?.subscription) {
          // Calculer la nouvelle période (30 jours)
          const now = new Date()
          const newPeriodEnd = new Date(now)
          newPeriodEnd.setDate(newPeriodEnd.getDate() + 30)

          await prisma.subscription.update({
            where: { id: school.subscription.id },
            data: {
              status: 'ACTIVE',
              currentPeriodEnd: newPeriodEnd,
              updatedAt: now
            }
          })

          console.log('✅ Abonnement activé pour l\'\u00e9cole:', schoolId)
        }
      } else {
        // Paiement échoué
        console.log('⚠️ Paiement échoué pour order_id:', callbackData.order_id)
      }
    }

    // Retourner la réponse attendue par VitePay (avec CORS)
    return corsJsonResponse(result.response)
  } catch (error) {
    console.error('❌ Erreur webhook VitePay:', error)
    // Même en cas d'erreur, retourner un statut 200 avec status: "0" (avec CORS)
    return corsJsonResponse({
      status: '0',
      message: 'Erreur lors du traitement du callback'
    })
  }
}
