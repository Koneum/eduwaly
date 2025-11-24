import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// GET - Récupérer les évaluations
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const moduleId = searchParams.get('moduleId')

    const where: Record<string, unknown> = {}
    
    if (studentId) where.studentId = studentId
    if (moduleId) where.moduleId = moduleId

    // ✅ OPTIMISÉ: Select précis au lieu de include profond
    const evaluations = await prisma.evaluation.findMany({
      where,
      select: {
        id: true,
        note: true,
        coefficient: true,
        type: true,
        date: true,
        validated: true,
        comment: true,
        studentId: true,
        moduleId: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            id: true,
            studentNumber: true,
            niveau: true,
            user: {
              select: {
                id: true,
                name: true
              }
            },
            filiere: {
              select: {
                id: true,
                nom: true
              }
            }
          }
        },
        module: {
          select: {
            id: true,
            nom: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({ evaluations })
  } catch (error) {
    console.error('Error fetching evaluations:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une évaluation
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || (user.role !== 'TEACHER' && user.role !== 'SCHOOL_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { studentId, moduleId, note, coefficient, type, date, comment } = body

    if (!studentId || !moduleId || note === undefined) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Validation de la note
    if (note < 0 || note > 20) {
      return NextResponse.json({ error: 'La note doit être entre 0 et 20' }, { status: 400 })
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        studentId,
        moduleId,
        note: parseFloat(note),
        coefficient: coefficient ? parseFloat(coefficient) : 1.0,
        type: type || 'DEVOIR',
        date: date ? new Date(date) : new Date(),
        comment: comment || null,
        validated: false
      },
      include: {
        student: {
          include: {
            user: true
          }
        },
        module: true
      }
    })

    return NextResponse.json({ evaluation }, { status: 201 })
  } catch (error) {
    console.error('Error creating evaluation:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour une évaluation
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || (user.role !== 'TEACHER' && user.role !== 'SCHOOL_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { id, note, coefficient, comment, validated } = body

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (note !== undefined) {
      if (note < 0 || note > 20) {
        return NextResponse.json({ error: 'La note doit être entre 0 et 20' }, { status: 400 })
      }
      updateData.note = parseFloat(note)
    }
    if (coefficient !== undefined) updateData.coefficient = parseFloat(coefficient)
    if (comment !== undefined) updateData.comment = comment
    if (validated !== undefined) updateData.validated = validated

    const evaluation = await prisma.evaluation.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ evaluation })
  } catch (error) {
    console.error('Error updating evaluation:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer une évaluation
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || (user.role !== 'TEACHER' && user.role !== 'SCHOOL_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    await prisma.evaluation.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting evaluation:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
