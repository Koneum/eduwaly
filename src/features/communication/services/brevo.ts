/**
 * Client Brevo pour l'envoi d'emails transactionnels
 * Documentation: https://developers.brevo.com/
 */

interface BrevoEmailParams {
  to: { email: string; name?: string }[]
  subject: string
  htmlContent: string
  textContent?: string
  sender?: { email: string; name: string }
  replyTo?: { email: string; name?: string }
  tags?: string[]
}

const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY
const BREVO_FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'noreply@schooly.app'
const BREVO_FROM_NAME = process.env.BREVO_FROM_NAME || 'Schooly'

/**
 * Envoyer un email via Brevo
 */
export async function sendEmail(params: BrevoEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!BREVO_API_KEY) {
      console.error('BREVO_API_KEY non configurée')
      return { success: false, error: 'Configuration email manquante' }
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: params.sender || { email: BREVO_FROM_EMAIL, name: BREVO_FROM_NAME },
        to: params.to,
        subject: params.subject,
        htmlContent: params.htmlContent,
        textContent: params.textContent,
        replyTo: params.replyTo,
        tags: params.tags,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Erreur Brevo:', error)
      return { success: false, error: `Erreur Brevo: ${response.status}` }
    }

    const data = await response.json()
    return { success: true, messageId: data.messageId }
  } catch (error) {
    console.error('Erreur envoi email:', error)
    return { success: false, error: 'Erreur lors de l\'envoi de l\'email' }
  }
}

/**
 * Email de bienvenue
 */
export async function sendWelcomeEmail(to: string, name: string, role: string) {
  return sendEmail({
    to: [{ email: to, name }],
    subject: 'Bienvenue sur Schooly',
    htmlContent: `
      <h1>Bienvenue ${name} !</h1>
      <p>Votre compte ${role} a été créé avec succès.</p>
      <p>Vous pouvez maintenant vous connecter à la plateforme.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/login">Se connecter</a>
    `,
    tags: ['welcome'],
  })
}

/**
 * Email de rappel de paiement
 */
export async function sendPaymentReminderEmail(
  to: string,
  name: string,
  amount: number,
  dueDate: Date
) {
  const formattedDate = dueDate.toLocaleDateString('fr-FR')
  const formattedAmount = amount.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'XOF',
  })

  return sendEmail({
    to: [{ email: to, name }],
    subject: 'Rappel de paiement - Schooly',
    htmlContent: `
      <h1>Rappel de paiement</h1>
      <p>Bonjour ${name},</p>
      <p>Nous vous rappelons qu'un paiement de <strong>${formattedAmount}</strong> est attendu pour le <strong>${formattedDate}</strong>.</p>
      <p>Pour effectuer votre paiement, connectez-vous à votre espace:</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/student/payments">Effectuer le paiement</a>
      <p>Cordialement,<br/>L'équipe Schooly</p>
    `,
    tags: ['payment-reminder'],
  })
}

/**
 * Email d'envoi de rapport
 */
export async function sendReportEmail(
  to: string,
  name: string,
  reportType: string,
  pdfUrl: string
) {
  return sendEmail({
    to: [{ email: to, name }],
    subject: `Votre ${reportType} - Schooly`,
    htmlContent: `
      <h1>${reportType}</h1>
      <p>Bonjour ${name},</p>
      <p>Votre ${reportType} est disponible.</p>
      <a href="${pdfUrl}">Télécharger le document</a>
      <p>Cordialement,<br/>L'équipe Schooly</p>
    `,
    tags: ['report'],
  })
}

/**
 * Email de notification d'absence
 */
export async function sendAbsenceNotification(
  to: string,
  parentName: string,
  studentName: string,
  date: Date,
  justified: boolean
) {
  const formattedDate = date.toLocaleDateString('fr-FR')
  const status = justified ? 'justifiée' : 'non justifiée'

  return sendEmail({
    to: [{ email: to, name: parentName }],
    subject: `Absence de ${studentName} - Schooly`,
    htmlContent: `
      <h1>Notification d'absence</h1>
      <p>Bonjour ${parentName},</p>
      <p>Nous vous informons que <strong>${studentName}</strong> a été absent(e) le <strong>${formattedDate}</strong>.</p>
      <p>Statut: <strong>${status}</strong></p>
      ${!justified ? '<p>Veuillez justifier cette absence dans votre espace parent.</p>' : ''}
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/parent/tracking">Voir les détails</a>
      <p>Cordialement,<br/>L'équipe Schooly</p>
    `,
    tags: ['absence'],
  })
}

/**
 * Email de notification de nouvelle note
 */
export async function sendGradeNotification(
  to: string,
  name: string,
  studentName: string,
  subject: string,
  grade: number,
  coefficient: number
) {
  return sendEmail({
    to: [{ email: to, name }],
    subject: `Nouvelle note pour ${studentName} - Schooly`,
    htmlContent: `
      <h1>Nouvelle note disponible</h1>
      <p>Bonjour ${name},</p>
      <p>Une nouvelle note a été saisie pour <strong>${studentName}</strong>:</p>
      <ul>
        <li>Matière: <strong>${subject}</strong></li>
        <li>Note: <strong>${grade}/20</strong></li>
        <li>Coefficient: <strong>${coefficient}</strong></li>
      </ul>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/parent/tracking">Voir les notes</a>
      <p>Cordialement,<br/>L'équipe Schooly</p>
    `,
    tags: ['grade'],
  })
}

/**
 * Email de notification de devoir
 */
export async function sendHomeworkNotification(
  to: string,
  name: string,
  title: string,
  dueDate: Date,
  moduleTitle: string
) {
  const formattedDate = dueDate.toLocaleDateString('fr-FR')

  return sendEmail({
    to: [{ email: to, name }],
    subject: `Nouveau devoir: ${title} - Schooly`,
    htmlContent: `
      <h1>Nouveau devoir</h1>
      <p>Bonjour ${name},</p>
      <p>Un nouveau devoir a été publié:</p>
      <ul>
        <li>Titre: <strong>${title}</strong></li>
        <li>Module: <strong>${moduleTitle}</strong></li>
        <li>Date limite: <strong>${formattedDate}</strong></li>
      </ul>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/student/homework">Voir le devoir</a>
      <p>Cordialement,<br/>L'équipe Schooly</p>
    `,
    tags: ['homework'],
  })
}

/**
 * Email de notification de message
 */
export async function sendMessageNotification(
  to: string,
  name: string,
  fromName: string,
  messagePreview: string,
  conversationId: string
) {
  return sendEmail({
    to: [{ email: to, name }],
    subject: `Nouveau message de ${fromName} - Schooly`,
    htmlContent: `
      <h1>Nouveau message</h1>
      <p>Bonjour ${name},</p>
      <p>Vous avez reçu un nouveau message de <strong>${fromName}</strong>:</p>
      <blockquote>${messagePreview}</blockquote>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/messages/${conversationId}">Lire le message</a>
      <p>Cordialement,<br/>L'équipe Schooly</p>
    `,
    tags: ['message'],
  })
}

/**
 * Email de création de compte avec identifiants
 */
export async function sendCredentialsEmail(
  to: string,
  name: string,
  email: string,
  temporaryPassword: string,
  role: string
) {
  return sendEmail({
    to: [{ email: to, name }],
    subject: 'Vos identifiants Schooly',
    htmlContent: `
      <h1>Bienvenue sur Schooly</h1>
      <p>Bonjour ${name},</p>
      <p>Votre compte <strong>${role}</strong> a été créé. Voici vos identifiants:</p>
      <ul>
        <li>Email: <strong>${email}</strong></li>
        <li>Mot de passe temporaire: <strong>${temporaryPassword}</strong></li>
      </ul>
      <p><strong>Important:</strong> Changez votre mot de passe lors de votre première connexion.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/login">Se connecter</a>
      <p>Cordialement,<br/>L'équipe Schooly</p>
    `,
    tags: ['credentials'],
  })
}

/**
 * Email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetToken: string
) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

  return sendEmail({
    to: [{ email: to, name }],
    subject: 'Réinitialisation de mot de passe - Schooly',
    htmlContent: `
      <h1>Réinitialisation de mot de passe</h1>
      <p>Bonjour ${name},</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe:</p>
      <a href="${resetUrl}">Réinitialiser mon mot de passe</a>
      <p>Ce lien est valable pendant 1 heure.</p>
      <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
      <p>Cordialement,<br/>L'équipe Schooly</p>
    `,
    tags: ['password-reset'],
  })
}
