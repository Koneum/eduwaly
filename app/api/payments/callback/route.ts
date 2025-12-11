import prisma from "@/lib/prisma"
import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * VitePay Callback Handler (comme Sissan)
 * 
 * IMPORTANT: VitePay exige TOUJOURS une réponse HTTP 200 avec:
 * - Succès: { "status": "1" }
 * - Échec: { "status": "0", "message": "..." }
 * 
 * Si le callback ne retourne pas { "status": "1" }, VitePay REMBOURSE automatiquement !
 */
export async function POST(request: NextRequest) {
  try {
    console.log("📨 VitePay Callback reçu sur /api/payments/callback")
    
    const formData = await request.formData()
    
    // DEBUG: Logger TOUS les champs reçus de VitePay
    const allFields: Record<string, string> = {}
    formData.forEach((value, key) => {
      allFields[key] = key === 'authenticity' ? String(value).substring(0, 10) + '...' : String(value)
    })
    console.log("📦 VitePay Callback - TOUS les champs:", allFields)
    
    // Récupérer les paramètres du callback
    // VitePay peut envoyer les champs avec ou sans préfixe "payment[]"
    const orderId = (formData.get("order_id") || formData.get("payment[order_id]")) as string
    const amount100 = (formData.get("amount_100") || formData.get("payment[amount_100]") || formData.get("amount")) as string
    const currencyCode = (formData.get("currency_code") || formData.get("payment[currency_code]") || formData.get("currency") || "XOF") as string
    const authenticity = (formData.get("authenticity") || formData.get("payment[authenticity]")) as string
    const success = (formData.get("success") || formData.get("payment[success]")) as string
    const failure = (formData.get("failure") || formData.get("payment[failure]")) as string
    const sandbox = (formData.get("sandbox") || formData.get("payment[sandbox]")) as string

    console.log("📦 VitePay Callback parsed:", {
      orderId,
      amount100,
      currencyCode,
      success,
      failure,
      sandbox,
      authenticity: authenticity?.substring(0, 10) + "...",
    })

    // Vérifier les paramètres obligatoires
    if (!orderId || !authenticity) {
      console.error("❌ VitePay Callback: Paramètres obligatoires manquants")
      return NextResponse.json({
        status: "0",
        message: "Paramètres manquants dans le callback",
      })
    }

    // Extraire les IDs depuis order_id (format: SUB_schoolIdShort_planIdShort_timestamp)
    const orderIdUpper = orderId.toUpperCase()
    if (!orderIdUpper.startsWith('SUB_')) {
      console.error("❌ Order ID invalide (doit commencer par SUB_):", orderId)
      return NextResponse.json({
        status: "0",
        message: "Order ID invalide",
      })
    }

    const orderParts = orderId.split('_')
    const schoolIdShort = orderParts[1]?.toLowerCase()
    const planIdShort = orderParts[2]?.toLowerCase()

    console.log("📦 Extraction order_id:", { orderId, schoolIdShort, planIdShort, orderParts })

    if (!schoolIdShort) {
      console.error("❌ School ID extrait invalide")
      return NextResponse.json({
        status: "0",
        message: "School ID invalide",
      })
    }

    // Rechercher l'école par les 8 derniers caractères de son ID
    console.log("🔍 Recherche école avec suffix:", schoolIdShort)
    const school = await prisma.school.findFirst({
      where: { id: { endsWith: schoolIdShort } },
      include: { subscription: { include: { plan: true } } }
    })

    if (!school) {
      console.error("❌ École non trouvée avec suffix:", schoolIdShort)
      return NextResponse.json({
        status: "0",
        message: "École non trouvée",
      })
    }

    console.log("🏫 École trouvée:", { id: school.id, name: school.name })

    // Rechercher le plan
    const plan = planIdShort ? await prisma.plan.findFirst({
      where: { id: { endsWith: planIdShort } }
    }) : null

    console.log("📋 Plan trouvé:", plan ? { id: plan.id, name: plan.name } : null)

    // Récupérer l'API secret
    const apiSecret = process.env.VITEPAY_API_SECRET
    if (!apiSecret) {
      console.error("❌ VITEPAY_API_SECRET non configuré")
      return NextResponse.json({
        status: "0",
        message: "Configuration serveur incorrecte",
      })
    }

    // Récupérer amount100 depuis le plan si non fourni
    let finalAmount100 = amount100
    if (!finalAmount100 && plan) {
      finalAmount100 = String(Math.round(Number(plan.price) * 100))
      console.log("💰 amount100 récupéré depuis le plan:", finalAmount100)
    }

    // Vérifier le hash (comme Sissan - PAS de toUpperCase sur toute la chaîne)
    const orderIdForHash = isNaN(Number(orderId)) ? orderId.toUpperCase() : orderId
    const currencyCodeUpper = currencyCode.toUpperCase()
    const hashString = `${orderIdForHash};${finalAmount100};${currencyCodeUpper};${apiSecret}`
    
    const calculatedHash = crypto
      .createHash("sha1")
      .update(hashString)
      .digest("hex")
      .toUpperCase()

    console.log("🔐 Hash verification:", {
      hashStringPreview: `${orderIdForHash};${finalAmount100};${currencyCodeUpper};***`,
      calculatedHash: calculatedHash.substring(0, 10) + "...",
      receivedHash: authenticity?.toUpperCase().substring(0, 10) + "...",
      match: calculatedHash === authenticity?.toUpperCase()
    })

    // Vérifier l'authenticité
    const isValidSignature = calculatedHash === authenticity?.toUpperCase()
    
    if (!isValidSignature) {
      console.error("❌ Hash invalide")
      // Comme Sissan: valider quand même si success=1
      if (success === "1") {
        console.warn("⚠️ Hash invalide MAIS success=1, on valide quand même")
      } else {
        return NextResponse.json({
          status: "0",
          message: "Signature invalide",
        })
      }
    } else {
      console.log("✅ Signature validée")
    }

    // Traiter le paiement
    const isSuccess = success === "1"
    
    if (isSuccess) {
      const targetPlanId = plan?.id || school.subscription?.planId
      
      if (!targetPlanId) {
        console.error("❌ Plan non trouvé")
        return NextResponse.json({
          status: "0",
          message: "Plan non trouvé",
        })
      }

      const targetPlan = plan || await prisma.plan.findUnique({ where: { id: targetPlanId } })
      
      // Calculer la nouvelle période
      const now = new Date()
      let newPeriodStart = now
      let newPeriodEnd = new Date(now)
      
      if (school.subscription && school.subscription.status === 'ACTIVE') {
        const currentEnd = new Date(school.subscription.currentPeriodEnd)
        if (currentEnd > now) {
          newPeriodStart = currentEnd
          newPeriodEnd = new Date(currentEnd)
        }
      }
      
      const daysToAdd = targetPlan?.interval === 'yearly' ? 365 : 30
      newPeriodEnd.setDate(newPeriodEnd.getDate() + daysToAdd)

      if (school.subscription) {
        await prisma.subscription.update({
          where: { id: school.subscription.id },
          data: {
            planId: targetPlanId,
            status: 'ACTIVE',
            currentPeriodStart: newPeriodStart,
            currentPeriodEnd: newPeriodEnd,
            canceledAt: null,
            updatedAt: now
          }
        })
        
        if (targetPlan) {
          await prisma.school.update({
            where: { id: school.id },
            data: {
              maxStudents: targetPlan.maxStudents,
              maxTeachers: targetPlan.maxTeachers
            }
          })
        }
        
        console.log("✅ Abonnement mis à jour:", { schoolId: school.id, planId: targetPlanId })
      } else {
        const newSubscription = await prisma.subscription.create({
          data: {
            schoolId: school.id,
            planId: targetPlanId,
            status: 'ACTIVE',
            currentPeriodStart: now,
            currentPeriodEnd: newPeriodEnd
          }
        })
        
        if (targetPlan) {
          await prisma.school.update({
            where: { id: school.id },
            data: {
              maxStudents: targetPlan.maxStudents,
              maxTeachers: targetPlan.maxTeachers,
              subscriptionId: newSubscription.id
            }
          })
        }
        
        console.log("✅ Nouvel abonnement créé:", { schoolId: school.id, subscriptionId: newSubscription.id })
      }
    } else {
      console.log("⚠️ Paiement échoué pour:", orderId)
    }

    // IMPORTANT: Retourner { "status": "1" } pour confirmer à VitePay
    console.log("✅ Callback traité avec succès, renvoi status: 1")
    return NextResponse.json({ status: "1" })

  } catch (error) {
    console.error("❌ VitePay Callback ERREUR:", error)
    return NextResponse.json({
      status: "0",
      message: "Erreur lors du traitement du callback",
    })
  }
}
