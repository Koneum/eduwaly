import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'

// GET: Récupérer les paiements d'un étudiant
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const schoolId = searchParams.get('schoolId')

    if (!studentId || !schoolId) {
      return NextResponse.json(
        { error: 'studentId et schoolId requis' },
        { status: 400 }
      )
    }

    // Vérifier les permissions
    const user = user
    const isAuthorized =
      user.role === 'SUPER_ADMIN' ||
      (user.role === 'SCHOOL_ADMIN' && user.schoolId === schoolId) ||
      (user.role === 'STUDENT' && user.id === studentId) ||
      user.role === 'PARENT'

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Récupérer les paiements
    const payments = await prisma.studentPayment.findMany({
      where: {
        studentId,
        student: { schoolId },
      },
      include: {
        student: {
          select: {
            user: {
              select: { name: true, email: true },
            },
            studentNumber: true,
          },
        },
        feeStructure: {
          select: {
            name: true,
            amount: true,
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST: Créer un nouveau paiement
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { studentId, feeStructureId, amount, paymentMethod, schoolId } = body

    if (!studentId || !feeStructureId || !amount || !paymentMethod || !schoolId) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Vérifier les permissions (Admin ou Super Admin uniquement)
    const user = user
    const isAuthorized =
      user.role === 'SUPER_ADMIN' ||
      (user.role === 'SCHOOL_ADMIN' && user.schoolId === schoolId)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Vérifier que l'étudiant appartient à l'école
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Étudiant non trouvé' },
        { status: 404 }
      )
    }

    // Créer le paiement
    const payment = await prisma.studentPayment.create({
      data: {
        studentId,
        feeStructureId,
        amountDue: parseFloat(amount),
        amountPaid: parseFloat(amount),
        dueDate: new Date(),
        paymentMethod,
        status: 'PAID',
        paidAt: new Date(),
      },
      include: {
        student: {
          select: {
            user: { select: { name: true, email: true } },
            studentNumber: true,
          },
        },
        feeStructure: {
          select: { name: true, amount: true },
        },
      },
    })

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du paiement:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PATCH: Mettre à jour le statut d'un paiement
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { paymentId, status, schoolId } = body

    if (!paymentId || !status || !schoolId) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Vérifier les permissions
    const user = user
    const isAuthorized =
      user.role === 'SUPER_ADMIN' ||
      (user.role === 'SCHOOL_ADMIN' && user.schoolId === schoolId)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Mettre à jour le paiement
    const payment = await prisma.studentPayment.update({
      where: { id: paymentId },
      data: { status },
      include: {
        student: {
          select: {
            user: { select: { name: true, email: true } },
            studentNumber: true,
          },
        },
      },
    })

    return NextResponse.json({ payment })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du paiement:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
