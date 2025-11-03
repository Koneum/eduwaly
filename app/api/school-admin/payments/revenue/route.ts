import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')

    if (!schoolId) {
      return NextResponse.json({ error: 'schoolId requis' }, { status: 400 })
    }

    // Vérifier l'accès
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== schoolId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer les paiements des 12 derniers mois
    const currentDate = new Date()
    const startDate = new Date(currentDate)
    startDate.setMonth(currentDate.getMonth() - 11)
    startDate.setDate(1)
    startDate.setHours(0, 0, 0, 0)

    const payments = await prisma.studentPayment.findMany({
      where: {
        feeStructure: { schoolId },
        status: 'PAID',
        paidAt: {
          gte: startDate
        }
      },
      select: {
        amountPaid: true,
        paidAt: true
      }
    })

    // Grouper par mois
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    const revenueByMonth: { [key: string]: number } = {}

    // Initialiser tous les mois à 0
    for (let i = 0; i < 12; i++) {
      const date = new Date(startDate)
      date.setMonth(startDate.getMonth() + i)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      revenueByMonth[monthKey] = 0
    }

    // Calculer les revenus par mois
    payments.forEach(payment => {
      if (payment.paidAt) {
        const date = new Date(payment.paidAt)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + Number(payment.amountPaid)
      }
    })

    // Formater pour le graphique
    const chartData = Object.keys(revenueByMonth)
      .sort()
      .map(monthKey => {
        const [year, month] = monthKey.split('-')
        const monthIndex = parseInt(month) - 1
        return {
          month: monthNames[monthIndex],
          revenue: Math.round(revenueByMonth[monthKey])
        }
      })

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('Erreur revenus:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des revenus' },
      { status: 500 }
    )
  }
}
