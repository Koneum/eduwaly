import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendPaymentReminderEmail } from '@/lib/brevo'

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

    // ✅ OPTIMISÉ: Include admin directement pour éviter N requêtes
    const subscriptions7Days = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: {
          gte: now,
          lte: in7Days
        }
      },
      select: {
        id: true,
        schoolId: true,
        currentPeriodEnd: true,
        school: {
          select: {
            id: true,
            name: true,
            users: {
              where: { role: 'SCHOOL_ADMIN' },
              select: {
                id: true,
                name: true,
                email: true
              },
              take: 1
            }
          }
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true
          }
        }
      }
    })

    // ✅ OPTIMISÉ: Include admin directement
    const subscriptions1Day = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: {
          gte: now,
          lte: tomorrow
        }
      },
      select: {
        id: true,
        schoolId: true,
        currentPeriodEnd: true,
        school: {
          select: {
            id: true,
            name: true,
            users: {
              where: { role: 'SCHOOL_ADMIN' },
              select: {
                id: true,
                name: true,
                email: true
              },
              take: 1
            }
          }
        },
        plan: {
          select: {
            id: true,
            name: true,
            price: true
          }
        }
      }
    })

    let sent7Days = 0
    let sent1Day = 0
    let errors = 0

    // ✅ Envoyer les rappels 7 jours avant (admin déjà chargé)
    for (const sub of subscriptions7Days) {
      try {
        const admin = sub.school.users[0]

        if (admin?.email) {
          await sendPaymentReminderEmail(
            admin.email,
            admin.name,
            Number(sub.plan.price),
            sub.currentPeriodEnd
          )
          sent7Days++
        }
      } catch (error) {
        console.error(`Erreur envoi rappel 7j pour ${sub.school.name}:`, error)
        errors++
      }
    }

    // ✅ Envoyer les rappels 1 jour avant (admin déjà chargé)
    for (const sub of subscriptions1Day) {
      try {
        const admin = sub.school.users[0]

        if (admin?.email) {
          await sendPaymentReminderEmail(
            admin.email,
            admin.name,
            Number(sub.plan.price),
            sub.currentPeriodEnd
          )
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
