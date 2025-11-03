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

    // Compter les paiements par statut
    const [paid, pending, overdue] = await Promise.all([
      // Payés
      prisma.studentPayment.count({
        where: {
          feeStructure: { schoolId },
          status: 'PAID'
        }
      }),
      // En attente
      prisma.studentPayment.count({
        where: {
          feeStructure: { schoolId },
          status: 'PENDING'
        }
      }),
      // En retard (date dépassée et non payé)
      prisma.studentPayment.count({
        where: {
          feeStructure: { schoolId },
          status: { in: ['PENDING', 'PARTIAL'] },
          dueDate: { lt: new Date() }
        }
      })
    ])

    return NextResponse.json({
      paid,
      pending: pending - overdue, // Soustraire les en retard des en attente
      overdue
    })
  } catch (error) {
    console.error('Erreur stats paiements:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    )
  }
}
