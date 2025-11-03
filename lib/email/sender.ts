import { sendEmail } from '@/lib/brevo-email'
import { EMAIL_TEMPLATES } from './templates'

export class EmailService {
  /**
   * Envoyer un email de bienvenue
   */
  static async sendWelcomeEmail(to: string, data: {
    schoolName: string
    adminName: string
  }) {
    const template = EMAIL_TEMPLATES.welcome(data)
    
    return sendEmail({
      to,
      subject: template.subject,
      htmlContent: template.html,
      senderName: 'Schooly'
    })
  }

  /**
   * Envoyer un rappel de paiement (7 jours avant)
   */
  static async sendPaymentReminder7Days(to: string, data: {
    schoolName: string
    amount: number
    dueDate: string
    planName: string
  }) {
    const template = EMAIL_TEMPLATES.paymentReminder7Days(data)
    
    return sendEmail({
      to,
      subject: template.subject,
      htmlContent: template.html,
      senderName: 'Schooly - Facturation'
    })
  }

  /**
   * Envoyer un rappel de paiement (1 jour avant)
   */
  static async sendPaymentReminder1Day(to: string, data: {
    schoolName: string
    amount: number
    dueDate: string
    planName: string
  }) {
    const template = EMAIL_TEMPLATES.paymentReminder1Day(data)
    
    return sendEmail({
      to,
      subject: template.subject,
      htmlContent: template.html,
      senderName: 'Schooly - Facturation'
    })
  }

  /**
   * Envoyer une confirmation de paiement
   */
  static async sendPaymentReceived(to: string, data: {
    schoolName: string
    amount: number
    reference: string
    nextDueDate: string
  }) {
    const template = EMAIL_TEMPLATES.paymentReceived(data)
    
    return sendEmail({
      to,
      subject: template.subject,
      htmlContent: template.html,
      senderName: 'Schooly - Facturation'
    })
  }

  /**
   * Envoyer une notification d'expiration
   */
  static async sendSubscriptionExpired(to: string, data: {
    schoolName: string
    planName: string
  }) {
    const template = EMAIL_TEMPLATES.subscriptionExpired(data)
    
    return sendEmail({
      to,
      subject: template.subject,
      htmlContent: template.html,
      senderName: 'Schooly'
    })
  }

  /**
   * Envoyer une notification de paiement étudiant en retard
   */
  static async sendStudentPaymentOverdue(to: string, data: {
    parentName: string
    studentName: string
    amount: number
    dueDate: string
    schoolName: string
  }) {
    const template = EMAIL_TEMPLATES.studentPaymentOverdue(data)
    
    return sendEmail({
      to,
      subject: template.subject,
      htmlContent: template.html,
      senderName: data.schoolName
    })
  }
}
