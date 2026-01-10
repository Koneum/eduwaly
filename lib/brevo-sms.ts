/**
 * Client Brevo pour l'envoi de SMS transactionnels
 * Documentation: https://developers.brevo.com/reference/sendtransacsms
 */

interface BrevoSmsParams {
  to: string
  content: string
  sender?: string
  tag?: string
  webUrl?: string
}

interface BrevoSmsResponse {
  success: boolean
  messageId?: string
  reference?: string
  error?: string
}

// Utiliser une clé spécifique SMS si disponible, sinon la clé principale
const BREVO_API_KEY = process.env.BREVO_SMS_API_KEY || process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY
const BREVO_SMS_SENDER = process.env.BREVO_SMS_SENDER || 'Eduwaly'
const DEFAULT_COUNTRY_CODE = '+223' // Mali par défaut

/**
 * Normaliser le numéro de téléphone
 * - Ajoute l'indicatif pays si manquant
 * - Supprime les espaces et caractères spéciaux
 */
export function normalizePhoneNumber(phone: string): string {
  // Supprimer tous les espaces, tirets, points
  let normalized = phone.replace(/[\s\-\.()]/g, '')
  
  // Si le numéro commence par 00, remplacer par +
  if (normalized.startsWith('00')) {
    normalized = '+' + normalized.substring(2)
  }
  
  // Si le numéro ne commence pas par +, ajouter l'indicatif par défaut
  if (!normalized.startsWith('+')) {
    // Si le numéro commence par 0, le retirer avant d'ajouter l'indicatif
    if (normalized.startsWith('0')) {
      normalized = normalized.substring(1)
    }
    normalized = DEFAULT_COUNTRY_CODE + normalized
  }
  
  return normalized
}

/**
 * Envoyer un SMS via Brevo
 * Format identique à TinyGest (qui fonctionne)
 */
export async function sendSms(params: BrevoSmsParams): Promise<BrevoSmsResponse> {
  try {
    if (!BREVO_API_KEY) {
      console.error('[BREVO SMS] API Key non configurée')
      return { success: false, error: 'Configuration SMS manquante' }
    }

    const normalizedPhone = normalizePhoneNumber(params.to)
    console.log(`[BREVO SMS] Envoi vers: ${normalizedPhone}`)

    const response = await fetch('https://api.brevo.com/v3/transactionalSMS/send', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: params.sender || BREVO_SMS_SENDER,
        recipient: normalizedPhone,
        content: params.content,
        type: 'transactional',
        unicodeEnabled: true,
      }),
    })

    const responseText = await response.text()
    console.log(`[BREVO SMS] Response status: ${response.status}`)
    console.log(`[BREVO SMS] Response body: ${responseText}`)

    if (!response.ok) {
      console.error('[BREVO SMS] Erreur:', responseText)
      return { success: false, error: `Erreur Brevo SMS: ${response.status} - ${responseText}` }
    }

    const data = JSON.parse(responseText)
    return { 
      success: true, 
      messageId: data.messageId,
      reference: data.reference 
    }
  } catch (error) {
    console.error('[BREVO SMS] Erreur envoi:', error)
    return { success: false, error: 'Erreur lors de l\'envoi du SMS' }
  }
}

/**
 * SMS de bienvenue
 */
export async function sendWelcomeSms(to: string, name: string) {
  return sendSms({
    to,
    content: `Bienvenue ${name} sur Schooly ! Votre compte a été créé avec succès. Connectez-vous sur ${process.env.NEXT_PUBLIC_APP_URL}`,
    tag: 'welcome',
  })
}

/**
 * SMS de rappel de paiement
 */
export async function sendPaymentReminderSms(
  to: string,
  name: string,
  amount: number,
  dueDate: Date
) {
  const formattedDate = dueDate.toLocaleDateString('fr-FR')
  const formattedAmount = amount.toLocaleString('fr-FR') + ' FCFA'

  return sendSms({
    to,
    content: `Schooly - Rappel: ${name}, un paiement de ${formattedAmount} est attendu pour le ${formattedDate}. Connectez-vous pour payer.`,
    tag: 'payment-reminder',
  })
}

/**
 * SMS de notification d'absence
 */
export async function sendAbsenceNotificationSms(
  to: string,
  parentName: string,
  studentName: string,
  date: Date
) {
  const formattedDate = date.toLocaleDateString('fr-FR')

  return sendSms({
    to,
    content: `Schooly - ${parentName}, ${studentName} a été absent(e) le ${formattedDate}. Veuillez justifier cette absence.`,
    tag: 'absence',
  })
}

/**
 * SMS d'envoi d'identifiants
 */
export async function sendCredentialsSms(
  to: string,
  name: string,
  email: string,
  temporaryPassword: string
) {
  return sendSms({
    to,
    content: `Schooly - ${name}, votre compte a été créé. Email: ${email} | Mot de passe: ${temporaryPassword}. Changez-le à la 1ère connexion.`,
    tag: 'credentials',
  })
}

/**
 * SMS de notification de note
 */
export async function sendGradeNotificationSms(
  to: string,
  studentName: string,
  subject: string,
  grade: number
) {
  return sendSms({
    to,
    content: `Schooly - Nouvelle note pour ${studentName}: ${grade}/20 en ${subject}. Consultez les détails sur votre espace.`,
    tag: 'grade',
  })
}

/**
 * SMS de code de vérification
 */
export async function sendVerificationCodeSms(to: string, code: string) {
  return sendSms({
    to,
    content: `Votre code de vérification Schooly est: ${code}. Valable 10 minutes.`,
    tag: 'verification',
  })
}

/**
 * SMS personnalisé
 */
export async function sendCustomSms(to: string, message: string, tag?: string) {
  return sendSms({
    to,
    content: message,
    tag: tag || 'custom',
  })
}
