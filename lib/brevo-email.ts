/**
 * Service d'envoi d'emails via Brevo (SendinBlue)
 */

interface SendEmailParams {
  to: string
  subject: string
  htmlContent: string
  textContent?: string
  senderName?: string
  senderEmail?: string
}

/**
 * Envoie un email via l'API Brevo
 */
export async function sendEmail({
  to,
  subject,
  htmlContent,
  textContent,
  senderName = process.env.BREVO_SENDER_NAME || 'Schooly',
  senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@schooly.com'
}: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  const apiKey = process.env.BREVO_API_KEY
  
  if (!apiKey) {
    console.error('BREVO_API_KEY non configurée')
    return { success: false, error: 'Configuration email manquante' }
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail
        },
        to: [
          {
            email: to,
            name: to.split('@')[0]
          }
        ],
        subject,
        htmlContent,
        textContent: textContent || htmlContent.replace(/<[^>]*>/g, '')
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Erreur Brevo:', error)
      return { success: false, error: error.message || 'Erreur envoi email' }
    }

    const data = await response.json()
    return { success: true, messageId: data.messageId }
    
  } catch (error) {
    console.error('Erreur envoi email:', error)
    return { success: false, error: 'Erreur réseau' }
  }
}

/**
 * Envoie les credentials d'enrôlement à un étudiant
 */
export async function sendEnrollmentCredentials(
  studentName: string,
  email: string,
  enrollmentCode: string,
  enrollmentUrl: string,
  schoolName: string
): Promise<{ success: boolean; error?: string }> {
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #FFC300; color: #2C3E50; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; margin: 0; border-radius: 0 0 8px 8px; }
    .credentials { background: white; padding: 20px; border-left: 4px solid #FFC300; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; background: #FFC300; color: #2C3E50; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
    .code { font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #FFC300; background: #2C3E50; padding: 8px 12px; border-radius: 4px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">🎓 Bienvenue à ${schoolName}</h1>
    </div>
    
    <div class="content">
      <h2 style="color: #2C3E50;">Bonjour ${studentName},</h2>
      
      <p>Votre compte étudiant a été créé avec succès ! Voici vos identifiants de connexion :</p>
      
      <div class="credentials">
        <p style="margin: 10px 0;"><strong>📧 Email :</strong> ${email}</p>
        <p style="margin: 10px 0;"><strong>🔑 Code d'inscription :</strong> <span class="code">${enrollmentCode}</span></p>
      </div>
      
      <p>Pour activer votre compte et définir votre mot de passe, cliquez sur le bouton ci-dessous :</p>
      
      <div style="text-align: center;">
        <a href="${enrollmentUrl}" class="button">✨ Activer mon compte</a>
      </div>
      
      <p style="font-size: 14px; color: #666;">Ou copiez ce lien dans votre navigateur :</p>
      <p style="word-break: break-all; color: #0066CC; font-size: 13px;">${enrollmentUrl}</p>
      
      <div style="background: #fff3cd; border-left: 4px solid #FFC300; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-weight: bold; color: #856404;">⚠️ Important :</p>
        <p style="margin: 5px 0 0 0; color: #856404;">Ce lien est valide pendant 30 jours. Après activation, vous pourrez vous connecter avec votre email et le mot de passe que vous aurez défini.</p>
      </div>
    </div>
    
    <div class="footer">
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
      <p>&copy; ${new Date().getFullYear()} ${schoolName}. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  return sendEmail({
    to: email,
    subject: `🎓 Vos identifiants de connexion - ${schoolName}`,
    htmlContent
  })
}
