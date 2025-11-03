import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// POST - Enregistrer un paiement
export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { studentId, amount, date, paymentMethod, feeStructureId, notes } = body

    // Validation
    if (!studentId || !amount || !date || !feeStructureId) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants (studentId, amount, date, feeStructureId)' },
        { status: 400 }
      )
    }

    // Vérifier que l'étudiant existe
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { schoolId: true }
    })

    if (!student) {
      return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 })
    }

    // Vérifier l'accès à l'école
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== student.schoolId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Vérifier si l'étudiant a une bourse active
    const scholarship = await prisma.scholarship.findFirst({
      where: {
        studentId,
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculer la réduction de la bourse
    let discountAmount = 0
    let scholarshipInfo = null
    
    if (scholarship) {
      const baseAmount = parseFloat(amount)
      
      if (scholarship.percentage) {
        // Réduction en pourcentage
        discountAmount = baseAmount * (scholarship.percentage / 100)
        scholarshipInfo = {
          type: scholarship.type,
          percentage: scholarship.percentage,
          name: scholarship.name
        }
      } else if (scholarship.amount) {
        // Réduction en montant fixe
        discountAmount = Math.min(Number(scholarship.amount), baseAmount)
        scholarshipInfo = {
          type: scholarship.type,
          amount: Number(scholarship.amount),
          name: scholarship.name
        }
      }
    }

    // Montant final après réduction
    const finalAmount = parseFloat(amount) - discountAmount

    // Créer le paiement
    const payment = await prisma.studentPayment.create({
      data: {
        studentId,
        feeStructureId,
        amountDue: parseFloat(amount),
        amountPaid: finalAmount,
        discountAmount: discountAmount,
        dueDate: new Date(date),
        paidAt: new Date(date),
        status: 'PAID',
        paymentMethod: paymentMethod || 'CASH',
        paidBy: user.id,
        notes: notes || null
      }
    })

    // Message personnalisé selon la bourse
    let message = 'Paiement enregistré avec succès'
    if (scholarshipInfo) {
      if (scholarshipInfo.percentage) {
        message += ` (Bourse de ${scholarshipInfo.percentage}% appliquée: -${discountAmount.toLocaleString()} FCFA)`
      } else if (scholarshipInfo.amount) {
        message += ` (Bourse appliquée: -${discountAmount.toLocaleString()} FCFA)`
      }
    }

    return NextResponse.json({
      message,
      payment: {
        ...payment,
        amountDue: Number(payment.amountDue),
        amountPaid: Number(payment.amountPaid),
        discountAmount: Number(payment.discountAmount)
      },
      scholarship: scholarshipInfo
    }, { status: 201 })
  } catch (error) {
    console.error('Erreur POST payment:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement du paiement' },
      { status: 500 }
    )
  }
}
