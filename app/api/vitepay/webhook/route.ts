import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Webhook VitePay - Traite les callbacks serveur-à-serveur
 * Documentation: https://api.vitepay.com/developers section 5
 * 
 * Format du callback VitePay:
 * - authenticity: SHA1("order_id;amount_100;currency_code;api_secret")
 * - order_id: doit être en majuscules (sauf numérique)
 * - currency_code: doit être en majuscules
 * - success=1 ou failure=1
 */

export async function POST(request: NextRequest) {
  try {
    console.log('📨 Callback VitePay reçu')
    
    // VitePay envoie les données en form-urlencoded
    const formData = await request.formData()
    
    const order_id = formData.get('order_id') as string
    const amount_100 = formData.get('amount_100') as string
    const currency_code = formData.get('currency_code') as string
    const authenticity = formData.get('authenticity') as string
    const success = formData.get('success') as string
    const failure = formData.get('failure') as string
    const sandbox = formData.get('sandbox') as string

    console.log('📦 Données callback:', {
      order_id,
      amount_100,
      currency_code,
      success,
      failure,
      sandbox
    })

    // 1. Recalculer la signature selon la doc
    const apiSecret = process.env.VITEPAY_API_SECRET
    if (!apiSecret) {
      console.error('❌ VITEPAY_API_SECRET manquant')
      return NextResponse.json({ 
        status: '0', 
        message: 'Configuration manquante' 
      }, { status: 500 })
    }

    // Format: SHA1("order_id;amount_100;currency_code;api_secret")
    const hashString = `${order_id};${amount_100};${currency_code};${apiSecret}`
    const calculatedAuthenticity = crypto
      .createHash("sha1")
      .update(hashString.toUpperCase()) // La chaîne doit être en MAJUSCULES avant le hash
      .digest("hex")
      .toLowerCase() // IMPORTANT: VitePay envoie le hash en minuscules !

    console.log('🔐 Vérification signature:', {
      received: authenticity,
      calculated: calculatedAuthenticity,
      hashString
    })

    // 2. Comparer la signature calculée à celle transmise par VitePay (case-insensitive)
    if (authenticity?.toLowerCase() !== calculatedAuthenticity) {
      console.error('❌ Signature invalide')
      return NextResponse.json({ 
        status: '0', 
        message: 'Signature invalide' 
      }, { status: 400 })
    }

    // 3. Vérifier que le numéro de commande est valide
    if (!order_id || !order_id.startsWith('SUB_')) {
      console.error('❌ Order ID invalide:', order_id)
      return NextResponse.json({ 
        status: '0', 
        message: 'Order ID invalide' 
      }, { status: 400 })
    }

    // Extraire schoolId depuis order_id (format: SUB_schoolId_timestamp avec underscores)
    const orderParts = order_id.split('_')
    const schoolId = orderParts[1]
    
    if (!schoolId) {
      console.error('❌ School ID extrait invalide')
      return NextResponse.json({ 
        status: '0', 
        message: 'School ID invalide' 
      }, { status: 400 })
    }

    // 4. Mettre à jour l'abonnement selon le statut
    const isSuccess = success === '1'
    const isFailure = failure === '1'

    console.log('🎯 Traitement paiement:', { schoolId, isSuccess, isFailure })

    if (isSuccess) {
      // Paiement réussi - Activer/mettre à jour l'abonnement
      try {
        const school = await prisma.school.findUnique({
          where: { id: schoolId },
          include: { subscription: true }
        })

        if (!school) {
          console.error('❌ École non trouvée:', schoolId)
          return NextResponse.json({ 
            status: '0', 
            message: 'École non trouvée' 
          }, { status: 404 })
        }

        // Calculer la nouvelle période (30 jours)
        const now = new Date()
        const newPeriodEnd = new Date(now)
        newPeriodEnd.setDate(newPeriodEnd.getDate() + 30)

        if (school.subscription) {
          // Mettre à jour l'abonnement existant
          await prisma.subscription.update({
            where: { id: school.subscription.id },
            data: {
              status: 'ACTIVE',
              currentPeriodEnd: newPeriodEnd,
              updatedAt: now
            }
          })
          console.log('✅ Abonnement mis à jour pour école:', schoolId)
        } else {
          // Créer un nouvel abonnement
          await prisma.subscription.create({
            data: {
              schoolId: schoolId,
              status: 'ACTIVE',
              currentPeriodStart: now, // Date de début de période
              currentPeriodEnd: newPeriodEnd,
              planId: 'cmiddzrbh00027dfmcw9rdxoa', // Plan TEST par défaut
              createdAt: now,
              updatedAt: now
            }
          })
          console.log('✅ Nouvel abonnement créé pour école:', schoolId)
        }

        // 5. Retourner la réponse de confirmation à VitePay
        return NextResponse.json({ status: '1' })

      } catch (dbError) {
        console.error('❌ Erreur base de données:', dbError)
        return NextResponse.json({ 
          status: '0', 
          message: 'Erreur lors de la mise à jour' 
        }, { status: 500 })
      }
    } else if (isFailure) {
      // Paiement échoué
      console.log('⚠️ Paiement échoué pour order_id:', order_id)
      
      // Mettre à jour le statut si abonnement existe
      try {
        const school = await prisma.school.findUnique({
          where: { id: schoolId },
          include: { subscription: true }
        })

        if (school?.subscription) {
          await prisma.subscription.update({
            where: { id: school.subscription.id },
            data: {
              status: 'CANCELED', // Corrigé: CANCELED au lieu de CANCELLED
              updatedAt: new Date()
            }
          })
        }
      } catch (dbError) {
        console.error('❌ Erreur mise à jour échec:', dbError)
      }

      return NextResponse.json({ status: '1' }) // Confirmer réception même si échec
    } else {
      // Statut inconnu
      console.error('❌ Statut de paiement inconnu:', { success, failure })
      return NextResponse.json({ 
        status: '0', 
        message: 'Statut de paiement inconnu' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Erreur webhook VitePay:', error)
    return NextResponse.json({ 
      status: '0', 
      message: 'Erreur serveur lors du traitement' 
    }, { status: 500 })
  }
}
