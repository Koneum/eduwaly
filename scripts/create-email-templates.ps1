# Script PowerShell pour créer les templates d'emails et relances automatiques

Write-Host "📧 Création du système d'emails..." -ForegroundColor Cyan
Write-Host ""

# 1. Templates d'emails
Write-Host "  → lib/email/templates.ts" -ForegroundColor Gray
@'
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
'@ | Out-File -FilePath "lib/email/templates.ts" -Encoding UTF8

# 2. Service d'envoi d'emails
Write-Host "  → lib/email/sender.ts" -ForegroundColor Gray
@'
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
'@ | Out-File -FilePath "lib/email/sender.ts" -Encoding UTF8

# 3. Cron job pour relances automatiques
Write-Host "  → app/api/cron/payment-reminders/route.ts" -ForegroundColor Gray
New-Item -ItemType Directory -Force -Path "app/api/cron/payment-reminders" | Out-Null
@'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { EmailService } from '@/lib/email/sender'

/**
 * Cron job pour envoyer les rappels de paiement automatiques
 * À configurer dans Vercel Cron Jobs ou similaire
 * Fréquence: Tous les jours à 9h00
 */
export async function GET() {
  try {
    console.log('🔄 Démarrage des rappels de paiement...')

    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Récupérer les abonnements qui expirent dans 7 jours
    const subscriptions7Days = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: {
          gte: now,
          lte: in7Days
        }
      },
      include: {
        school: true,
        plan: true
      }
    })

    // Récupérer les abonnements qui expirent demain
    const subscriptions1Day = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: {
          gte: now,
          lte: tomorrow
        }
      },
      include: {
        school: true,
        plan: true
      }
    })

    let sent7Days = 0
    let sent1Day = 0
    let errors = 0

    // Envoyer les rappels 7 jours avant
    for (const sub of subscriptions7Days) {
      try {
        const admin = await prisma.user.findFirst({
          where: {
            schoolId: sub.schoolId,
            role: 'SCHOOL_ADMIN'
          }
        })

        if (admin?.email) {
          await EmailService.sendPaymentReminder7Days(admin.email, {
            schoolName: sub.school.name,
            amount: Number(sub.plan.price),
            dueDate: sub.currentPeriodEnd.toLocaleDateString('fr-FR'),
            planName: sub.plan.name
          })
          sent7Days++
        }
      } catch (error) {
        console.error(`Erreur envoi rappel 7j pour ${sub.school.name}:`, error)
        errors++
      }
    }

    // Envoyer les rappels 1 jour avant
    for (const sub of subscriptions1Day) {
      try {
        const admin = await prisma.user.findFirst({
          where: {
            schoolId: sub.schoolId,
            role: 'SCHOOL_ADMIN'
          }
        })

        if (admin?.email) {
          await EmailService.sendPaymentReminder1Day(admin.email, {
            schoolName: sub.school.name,
            amount: Number(sub.plan.price),
            dueDate: sub.currentPeriodEnd.toLocaleDateString('fr-FR'),
            planName: sub.plan.name
          })
          sent1Day++
        }
      } catch (error) {
        console.error(`Erreur envoi rappel 1j pour ${sub.school.name}:`, error)
        errors++
      }
    }

    console.log(`✅ Rappels envoyés: ${sent7Days} (7j) + ${sent1Day} (1j)`)
    console.log(`❌ Erreurs: ${errors}`)

    return NextResponse.json({
      success: true,
      sent: {
        sevenDays: sent7Days,
        oneDay: sent1Day
      },
      errors
    })
  } catch (error) {
    console.error('❌ Erreur cron rappels:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi des rappels' },
      { status: 500 }
    )
  }
}
'@ | Out-File -FilePath "app/api/cron/payment-reminders/route.ts" -Encoding UTF8

Write-Host ""
Write-Host "✅ Système d'emails créé avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Fichiers créés:" -ForegroundColor Yellow
Write-Host "  • lib/email/templates.ts - 6 templates d'emails" -ForegroundColor Gray
Write-Host "  • lib/email/sender.ts - Service d'envoi" -ForegroundColor Gray
Write-Host "  • app/api/cron/payment-reminders/route.ts - Relances automatiques" -ForegroundColor Gray
Write-Host ""
Write-Host "⚙️ Configuration Vercel Cron:" -ForegroundColor Yellow
Write-Host "  Ajouter dans vercel.json:" -ForegroundColor White
Write-Host '  {' -ForegroundColor Gray
Write-Host '    "crons": [{' -ForegroundColor Gray
Write-Host '      "path": "/api/cron/payment-reminders",' -ForegroundColor Gray
Write-Host '      "schedule": "0 9 * * *"' -ForegroundColor Gray
Write-Host '    }]' -ForegroundColor Gray
Write-Host '  }' -ForegroundColor Gray
Write-Host ""
