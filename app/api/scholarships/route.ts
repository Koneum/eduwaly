import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'

// GET: Récupérer les bourses
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const schoolId = searchParams.get('schoolId')

    if (!schoolId) {
      return NextResponse.json(
        { error: 'schoolId requis' },
        { status: 400 }
      )
    }

    // Construire la requête
    const where: any = {
      student: { schoolId },
    }

    if (studentId) {
      where.studentId = studentId
    }

    // Récupérer les bourses
    const scholarships = await prisma.scholarship.findMany({
      where,
      include: {
        student: {
          select: {
            user: {
              select: { name: true, email: true },
            },
            studentNumber: true,
            niveau: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ scholarships })
  } catch (error) {
    console.error('Erreur lors de la récupération des bourses:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST: Créer une nouvelle bourse
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { studentId, name, amount, type, startDate, endDate, schoolId } = body

    if (!studentId || !name || !amount || !type || !startDate || !endDate || !schoolId) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
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

    // Créer la bourse
    const scholarship = await prisma.scholarship.create({
      data: {
        studentId,
        name,
        amount: parseFloat(amount),
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'ACTIVE',
      },
      include: {
        student: {
          select: {
            user: { select: { name: true, email: true } },
            studentNumber: true,
          },
        },
      },
    })

    return NextResponse.json({ scholarship }, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de la bourse:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PATCH: Mettre à jour une bourse
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { scholarshipId, status, amount } = body

    if (!scholarshipId) {
      return NextResponse.json(
        { error: 'scholarshipId requis' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (amount) updateData.amount = parseFloat(amount)

    // Mettre à jour la bourse
    const scholarship = await prisma.scholarship.update({
      where: { id: scholarshipId },
      data: updateData,
      include: {
        student: {
          select: {
            user: { select: { name: true, email: true } },
            studentNumber: true,
          },
        },
      },
    })

    return NextResponse.json({ scholarship })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la bourse:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE: Supprimer une bourse
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const scholarshipId = searchParams.get('scholarshipId')

    if (!scholarshipId) {
      return NextResponse.json(
        { error: 'scholarshipId requis' },
        { status: 400 }
      )
    }

    await prisma.scholarship.delete({
      where: { id: scholarshipId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la suppression de la bourse:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
