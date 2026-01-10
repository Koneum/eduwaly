import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import { sendSms, sendCustomSms, normalizePhoneNumber } from '@/lib/brevo-sms'

/**
 * POST /api/sms/send
 * Envoyer un SMS via Brevo
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { to, message, tag } = body

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Numéro de téléphone et message requis' },
        { status: 400 }
      )
    }

    // Normaliser le numéro
    const normalizedPhone = normalizePhoneNumber(to)
    console.log(`[SMS API] Envoi vers: ${to} -> ${normalizedPhone}`)

    const result = await sendCustomSms(to, message, tag)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, normalizedPhone },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      reference: result.reference,
      normalizedPhone,
    })
  } catch (error) {
    console.error('[SMS API] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du SMS' },
      { status: 500 }
    )
  }
}
