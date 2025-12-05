import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { getAuthUser } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    console.log("🔥 Début création paiement VitePay")
    
    const user = await getAuthUser()
    
    if (!user || (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ 
        success: false,
        error: 'Non autorisé' 
      }, { status: 401 })
    }

    const body = await request.json()
    console.log("� Body reçu:", body)
    
    const { planId, schoolId } = body

    // Validation des paramètres
    if (!planId || !schoolId) {
      console.error("❌ Paramètres manquants:", { planId, schoolId })
      return NextResponse.json(
        { 
          success: false,
          error: "Paramètres manquants: planId, schoolId requis",
          received: { planId, schoolId }
        },
        { status: 400 }
      )
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
        { 
          success: false,
          error: 'Plan ou école introuvable' 
        },
        { status: 404 }
      )
    }

    // Configuration VitePay
    const apiKey = process.env.VITEPAY_API_KEY
    const apiSecret = process.env.VITEPAY_API_SECRET
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    
    // Forcer HTTPS pour la production
    if (process.env.NODE_ENV === 'production' && baseUrl.startsWith('http://')) {
      baseUrl = baseUrl.replace('http://', 'https://')
    }

    console.log("🔑 Config VitePay:", { 
      hasApiKey: !!apiKey, 
      hasApiSecret: !!apiSecret,
      baseUrl,
      originalUrl: process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL
    })

    if (!apiKey || !apiSecret) {
      console.error("❌ Configuration VitePay manquante")
      return NextResponse.json(
        { 
          success: false,
          error: "Configuration VitePay manquante",
          details: "VITEPAY_API_KEY ou VITEPAY_API_SECRET non défini"
        },
        { status: 500 }
      )
    }

    // Générer un ID de commande unique
    const orderId = `SUB-${school.id}-${Date.now()}`.toUpperCase() // Nouveau : Mettre orderId en majuscules immédiatement

    // Montant en centimes (multiplier par 100)
    const amount100 = Math.round(Number(plan.price) * 100)

    // Nettoyer baseUrl (enlever le slash final s'il existe)
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

    // URLs de callback
    const callbackUrl = `${cleanBaseUrl}/api/vitepay/webhook`
    const returnUrl = `${cleanBaseUrl}/admin/${schoolId}/subscription?status=success&order_id=${orderId}`
    const declineUrl = `${cleanBaseUrl}/admin/${schoolId}/subscription?status=declined&order_id=${orderId}`
    const cancelUrl = `${cleanBaseUrl}/admin/${schoolId}/subscription?status=cancelled&order_id=${orderId}`

    // Générer le hash SHA1 selon la doc VitePay
    // Format: SHA1(UPPERCASE("order_id;amount_100;currency_code;callback_url;api_secret"))
    const hashString = `${orderId};${amount100};XOF;${callbackUrl};${apiSecret}` // orderId est déjà en majuscules
    const hash = crypto
      .createHash("sha1")
      .update(hashString.toUpperCase()) // L'intégralité de la chaîne est mise en MAJUSCULES
      .digest("hex") // VitePay accepte lowercase

    console.log("🔐 Hash généré:", {
      hashString,
      hash,
      orderId,
      orderIdUppercase: orderId.toString().toUpperCase(),
      amount100
    })

    // Préparer les données pour VitePay - version exacte comme le projet de référence
    const formData = new URLSearchParams({
      "payment[language_code]": "fr",
      "payment[currency_code]": "XOF",
      "payment[country_code]": "ML",
      "payment[order_id]": orderId.toString(), // Envoyer la version en MAJUSCULES
      "payment[description]": `Abonnement ${plan.name} - ${school.name}`,
      "payment[amount_100]": amount100.toString(),
      "payment[buyer_ip_adress]": request.headers.get("x-forwarded-for")?.split(',')[0]?.trim() || request.headers.get("x-real-ip") || "41.73.244.1", // IP valide Mali par défaut
      "payment[return_url]": returnUrl,
      "payment[decline_url]": declineUrl,
      "payment[cancel_url]": cancelUrl,
      "payment[callback_url]": callbackUrl,
      "payment[email]": school.email || user.email,
      "payment[p_type]": "orange_money",
      api_key: apiKey,
      hash: hash,
    })

    console.log("📤 Données complètes envoyées à VitePay (selon doc officielle):")
    console.log("FormData entries:")
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}: ${value}`)
    }
    
    console.log("📤 URL complète:", formData.toString())

    // Détecter le mode (sandbox pour tests, prod pour production)
    const vitepayMode = process.env.VITEPAY_MODE || 'prod'
    const vitepayApiUrl = `https://api.vitepay.com/v1/${vitepayMode}/payments`
    
    console.log("🌐 Mode VitePay:", vitepayMode, "URL:", vitepayApiUrl)

    // Appel à l'API VitePay
    const vitepayResponse = await fetch(vitepayApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    })

    const responseText = await vitepayResponse.text()
    
    console.log("📡 Réponse VitePay:", {
      status: vitepayResponse.status,
      statusText: vitepayResponse.statusText,
      response: responseText,
    })
    
    // VitePay retourne directement l'URL de redirection en texte
    if (vitepayResponse.ok && responseText.includes("checkout")) {
      return NextResponse.json({
        success: true,
        redirectUrl: responseText.trim(),
        orderId: orderId,
        amount: Number(plan.price)
      })
    }

    // En cas d'erreur
    console.error("❌ Erreur VitePay:", responseText)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de l'initialisation du paiement",
        details: responseText,
      },
      { status: 400 }
    )
  } catch (error) {
    console.error("❌ Erreur création paiement VitePay:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur lors de l'initialisation du paiement",
        details: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    )
  }
}
