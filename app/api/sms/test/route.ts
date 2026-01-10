import { NextRequest, NextResponse } from 'next/server'
import { sendCustomSms, normalizePhoneNumber } from '@/lib/brevo-sms'

/**
 * POST /api/sms/test
 * Test d'envoi SMS - Réservé aux admins
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, message } = body

    const testPhone = to || '+22393439653'
    const testMessage = message || 'Test SMS Schooly - Configuration réussie!'

    console.log(`[SMS TEST] Envoi test vers: ${testPhone}`)
    console.log(`[SMS TEST] Message: ${testMessage}`)
    console.log(`[SMS TEST] Numéro normalisé: ${normalizePhoneNumber(testPhone)}`)

    const result = await sendCustomSms(testPhone, testMessage, 'test')

    console.log('[SMS TEST] Résultat:', result)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        testPhone,
        normalizedPhone: normalizePhoneNumber(testPhone),
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      reference: result.reference,
      testPhone,
      normalizedPhone: normalizePhoneNumber(testPhone),
      message: 'SMS envoyé avec succès!',
    })
  } catch (error) {
    console.error('[SMS TEST] Erreur:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }, { status: 500 })
  }
}

/**
 * GET /api/sms/test
 * Vérifier la configuration SMS
 */
export async function GET() {
  const hasApiKey = !!(process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY)
  const smsSender = process.env.BREVO_SMS_SENDER || 'Schooly'

  return NextResponse.json({
    configured: hasApiKey,
    sender: smsSender,
    defaultCountryCode: '+223',
    message: hasApiKey 
      ? 'Configuration SMS OK - Prêt à envoyer' 
      : 'BREVO_API_KEY manquante dans .env',
  })
}
