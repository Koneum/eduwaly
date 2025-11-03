import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'

// DELETE - Supprimer définitivement une bourse
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { id } = await params

    // Vérifier que la bourse existe
    const scholarship = await prisma.scholarship.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            schoolId: true
          }
        }
      }
    })

    if (!scholarship) {
      return NextResponse.json({ error: 'Bourse non trouvée' }, { status: 404 })
    }

    // Vérifier l'accès à l'école (si bourse liée à un étudiant)
    if (scholarship.student && user.role !== 'SUPER_ADMIN' && user.schoolId !== scholarship.student.schoolId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Supprimer la bourse
    await prisma.scholarship.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Bourse supprimée avec succès'
    })
  } catch (error) {
    console.error('Erreur DELETE scholarship:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la bourse' },
      { status: 500 }
    )
  }
}

// PUT - Modifier une bourse
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, type, percentage, amount, description } = body

    // Vérifier que la bourse existe
    const scholarship = await prisma.scholarship.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            schoolId: true
          }
        }
      }
    })

    if (!scholarship) {
      return NextResponse.json({ error: 'Bourse non trouvée' }, { status: 404 })
    }

    // Vérifier l'accès à l'école (si bourse liée à un étudiant)
    if (scholarship.student && user.role !== 'SUPER_ADMIN' && user.schoolId !== scholarship.student.schoolId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Mettre à jour la bourse
    const updatedScholarship = await prisma.scholarship.update({
      where: { id },
      data: {
        name: name || scholarship.name,
        type: type || scholarship.type,
        percentage: percentage !== undefined ? (percentage ? parseFloat(percentage) : null) : scholarship.percentage,
        amount: amount !== undefined ? (amount ? parseFloat(amount) : null) : scholarship.amount,
        reason: description || scholarship.reason
      }
    })

    return NextResponse.json({
      message: 'Bourse modifiée avec succès',
      scholarship: {
        ...updatedScholarship,
        amount: updatedScholarship.amount ? Number(updatedScholarship.amount) : null
      }
    })
  } catch (error) {
    console.error('Erreur PUT scholarship:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification de la bourse' },
      { status: 500 }
    )
  }
}
