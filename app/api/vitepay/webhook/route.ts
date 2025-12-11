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
    // Format attendu: schoolId_planId_timestamp
    if (!order_id || !order_id.includes('_')) {
      console.error('❌ Order ID invalide:', order_id)
      return NextResponse.json({ 
        status: '0', 
        message: 'Order ID invalide' 
      }, { status: 400 })
    }

    // Extraire schoolId et planId depuis order_id (format: schoolId_planId_timestamp)
    const orderParts = order_id.split('_')
    const schoolId = orderParts[0]
    const planId = orderParts.length >= 2 ? orderParts[1] : null
    
    console.log('📦 Extraction order_id:', { schoolId, planId, orderParts })
    
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
        // Récupérer l'école et le plan
        const [school, plan] = await Promise.all([
          prisma.school.findUnique({
            where: { id: schoolId },
            include: { subscription: { include: { plan: true } } }
          }),
          planId ? prisma.plan.findUnique({ where: { id: planId } }) : null
        ])

        if (!school) {
          console.error('❌ École non trouvée:', schoolId)
          return NextResponse.json({ 
            status: '0', 
            message: 'École non trouvée' 
          }, { status: 404 })
        }

        // Utiliser le plan extrait de l'order_id ou un plan par défaut
        const targetPlanId = planId || plan?.id || school.subscription?.planId
        if (!targetPlanId) {
          console.error('❌ Plan non trouvé:', planId)
          return NextResponse.json({ 
            status: '0', 
            message: 'Plan non trouvé' 
          }, { status: 404 })
        }

        // Récupérer les infos du plan pour les limites
        const targetPlan = plan || await prisma.plan.findUnique({ where: { id: targetPlanId } })
        
        console.log('📋 Plan cible:', { 
          planId: targetPlanId, 
          planName: targetPlan?.name,
          currentPlan: school.subscription?.plan?.name
        })

        // Calculer la nouvelle période
        const now = new Date()
        let newPeriodStart = now
        let newPeriodEnd = new Date(now)
        
        // Si abonnement existant et encore actif, prolonger depuis la fin actuelle
        if (school.subscription && school.subscription.status === 'ACTIVE') {
          const currentEnd = new Date(school.subscription.currentPeriodEnd)
          if (currentEnd > now) {
            // Prolonger depuis la fin de la période actuelle
            newPeriodStart = currentEnd
            newPeriodEnd = new Date(currentEnd)
          }
        }
        
        // Ajouter 30 jours (ou selon l'intervalle du plan)
        const daysToAdd = targetPlan?.interval === 'yearly' ? 365 : 30
        newPeriodEnd.setDate(newPeriodEnd.getDate() + daysToAdd)

        if (school.subscription) {
          // Mettre à jour l'abonnement existant (renouvellement ou changement de plan)
          await prisma.subscription.update({
            where: { id: school.subscription.id },
            data: {
              planId: targetPlanId, // Mettre à jour le plan (upgrade/downgrade)
              status: 'ACTIVE',
              currentPeriodStart: newPeriodStart,
              currentPeriodEnd: newPeriodEnd,
              canceledAt: null, // Réactiver si était annulé
              updatedAt: now
            }
          })
          
          // Mettre à jour les limites de l'école selon le nouveau plan
          if (targetPlan) {
            await prisma.school.update({
              where: { id: schoolId },
              data: {
                maxStudents: targetPlan.maxStudents,
                maxTeachers: targetPlan.maxTeachers
              }
            })
          }
          
          console.log('✅ Abonnement mis à jour:', {
            schoolId,
            planId: targetPlanId,
            newPeriodEnd,
            isUpgrade: school.subscription.planId !== targetPlanId
          })
        } else {
          // Créer un nouvel abonnement
          const newSubscription = await prisma.subscription.create({
            data: {
              schoolId: schoolId,
              planId: targetPlanId,
              status: 'ACTIVE',
              currentPeriodStart: now,
              currentPeriodEnd: newPeriodEnd
            }
          })
          
          // Mettre à jour les limites de l'école
          if (targetPlan) {
            await prisma.school.update({
              where: { id: schoolId },
              data: {
                maxStudents: targetPlan.maxStudents,
                maxTeachers: targetPlan.maxTeachers,
                subscriptionId: newSubscription.id
              }
            })
          }
          
          console.log('✅ Nouvel abonnement créé:', {
            schoolId,
            planId: targetPlanId,
            subscriptionId: newSubscription.id
          })
        }

        // Retourner la réponse de confirmation à VitePay
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
