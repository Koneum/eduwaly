/**
 * Templates d'emails pour Brevo
 */

export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export const EMAIL_TEMPLATES = {
  /**
   * Email de bienvenue après inscription
   */
  welcome: (data: { schoolName: string; adminName: string }): EmailTemplate => ({
    subject: `Bienvenue sur Schooly - ${data.schoolName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Bienvenue sur Schooly! 🎓</h1>
        <p>Bonjour ${data.adminName},</p>
        <p>Félicitations! Votre établissement <strong>${data.schoolName}</strong> est maintenant inscrit sur Schooly.</p>
        <p>Vous pouvez dès maintenant:</p>
        <ul>
          <li>Configurer votre établissement</li>
          <li>Ajouter des enseignants et étudiants</li>
          <li>Créer des emplois du temps</li>
          <li>Gérer les notes et absences</li>
        </ul>
        <p>Votre période d'essai de 30 jours commence maintenant.</p>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accéder à mon tableau de bord
          </a>
        </p>
        <p>Besoin d'aide? Contactez-nous à support@schooly.com</p>
      </div>
    `
  }),

  /**
   * Rappel de paiement - 7 jours avant échéance
   */
  paymentReminder7Days: (data: {
    schoolName: string
    amount: number
    dueDate: string
    planName: string
  }): EmailTemplate => ({
    subject: `Rappel: Paiement à venir - ${data.schoolName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Rappel de paiement</h2>
        <p>Bonjour,</p>
        <p>Votre abonnement <strong>${data.planName}</strong> arrive à échéance le <strong>${data.dueDate}</strong>.</p>
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Montant:</strong> ${data.amount.toLocaleString()} FCFA</p>
          <p style="margin: 10px 0 0 0;"><strong>Date limite:</strong> ${data.dueDate}</p>
        </div>
        <p>Pour éviter toute interruption de service, veuillez effectuer le paiement avant cette date.</p>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/subscription" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Payer maintenant
          </a>
        </p>
      </div>
    `
  }),

  /**
   * Rappel de paiement - 1 jour avant échéance
   */
  paymentReminder1Day: (data: {
    schoolName: string
    amount: number
    dueDate: string
    planName: string
  }): EmailTemplate => ({
    subject: `⚠️ URGENT: Paiement demain - ${data.schoolName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #DC2626;">⚠️ Paiement urgent</h2>
        <p>Bonjour,</p>
        <p><strong>Votre abonnement expire demain!</strong></p>
        <div style="background-color: #FEE2E2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
          <p style="margin: 0;"><strong>Montant:</strong> ${data.amount.toLocaleString()} FCFA</p>
          <p style="margin: 10px 0 0 0;"><strong>Date limite:</strong> ${data.dueDate}</p>
        </div>
        <p>Sans paiement, votre accès sera suspendu après cette date.</p>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/subscription" 
             style="background-color: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Payer immédiatement
          </a>
        </p>
      </div>
    `
  }),

  /**
   * Paiement reçu
   */
  paymentReceived: (data: {
    schoolName: string
    amount: number
    reference: string
    nextDueDate: string
  }): EmailTemplate => ({
    subject: `✅ Paiement reçu - ${data.schoolName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">✅ Paiement confirmé</h2>
        <p>Bonjour,</p>
        <p>Nous avons bien reçu votre paiement. Merci!</p>
        <div style="background-color: #D1FAE5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Montant:</strong> ${data.amount.toLocaleString()} FCFA</p>
          <p style="margin: 10px 0 0 0;"><strong>Référence:</strong> ${data.reference}</p>
          <p style="margin: 10px 0 0 0;"><strong>Prochaine échéance:</strong> ${data.nextDueDate}</p>
        </div>
        <p>Votre abonnement est maintenant actif jusqu'au ${data.nextDueDate}.</p>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/subscription" 
             style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Voir mon abonnement
          </a>
        </p>
      </div>
    `
  }),

  /**
   * Abonnement expiré
   */
  subscriptionExpired: (data: {
    schoolName: string
    planName: string
  }): EmailTemplate => ({
    subject: `🚫 Abonnement expiré - ${data.schoolName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #DC2626;">🚫 Abonnement expiré</h2>
        <p>Bonjour,</p>
        <p>Votre abonnement <strong>${data.planName}</strong> a expiré.</p>
        <p>Votre accès à Schooly est maintenant suspendu.</p>
        <p>Pour réactiver votre compte, veuillez renouveler votre abonnement.</p>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/subscription" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Renouveler mon abonnement
          </a>
        </p>
      </div>
    `
  }),

  /**
   * Notification de paiement étudiant en retard (pour parents)
   */
  studentPaymentOverdue: (data: {
    parentName: string
    studentName: string
    amount: number
    dueDate: string
    schoolName: string
  }): EmailTemplate => ({
    subject: `Rappel: Frais de scolarité en retard - ${data.studentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F59E0B;">Rappel de paiement</h2>
        <p>Bonjour ${data.parentName},</p>
        <p>Les frais de scolarité de <strong>${data.studentName}</strong> sont en retard.</p>
        <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Montant dû:</strong> ${data.amount.toLocaleString()} FCFA</p>
          <p style="margin: 10px 0 0 0;"><strong>Date d'échéance:</strong> ${data.dueDate}</p>
        </div>
        <p>Veuillez régulariser cette situation dans les plus brefs délais.</p>
        <p>Pour toute question, contactez l'administration de ${data.schoolName}.</p>
      </div>
    `
  })
}
