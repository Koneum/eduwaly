import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'

// GET: Récupérer les structures de frais
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const schoolId = searchParams.get('schoolId')
    const filiereId = searchParams.get('filiereId')

    if (!schoolId) {
      return NextResponse.json(
        { error: 'schoolId requis' },
        { status: 400 }
      )
    }

    // Construire la requête
    const where: any = { schoolId }
    if (filiereId) {
      where.filiereId = filiereId
    }

    // Récupérer les structures de frais
    const feeStructures = await prisma.feeStructure.findMany({
      where,
      include: {
        filiere: {
          select: { nom: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ feeStructures })
  } catch (error) {
    console.error('Erreur lors de la récupération des structures de frais:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST: Créer une nouvelle structure de frais
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { name, amount, type, filiereId, schoolId, dueDate, academicYear } = body

    if (!name || !amount || !type || !schoolId || !academicYear) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Créer la structure de frais
    const feeStructure = await prisma.feeStructure.create({
      data: {
        name,
        amount: parseFloat(amount),
        type,
        filiereId: filiereId || null,
        schoolId,
        academicYear,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        filiere: {
          select: { nom: true },
        },
      },
    })

    return NextResponse.json({ feeStructure }, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de la structure de frais:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PATCH: Mettre à jour une structure de frais
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { feeStructureId, name, amount, type, dueDate } = body

    if (!feeStructureId) {
      return NextResponse.json(
        { error: 'feeStructureId requis' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (amount) updateData.amount = parseFloat(amount)
    if (type) updateData.type = type
    if (dueDate) updateData.dueDate = new Date(dueDate)

    // Mettre à jour la structure de frais
    const feeStructure = await prisma.feeStructure.update({
      where: { id: feeStructureId },
      data: updateData,
      include: {
        filiere: {
          select: { nom: true },
        },
      },
    })

    return NextResponse.json({ feeStructure })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la structure de frais:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE: Supprimer une structure de frais
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const feeStructureId = searchParams.get('feeStructureId')

    if (!feeStructureId) {
      return NextResponse.json(
        { error: 'feeStructureId requis' },
        { status: 400 }
      )
    }

    await prisma.feeStructure.delete({
      where: { id: feeStructureId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la suppression de la structure de frais:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
