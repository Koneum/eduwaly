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
