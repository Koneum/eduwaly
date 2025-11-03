import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'

// PUT - Retirer une bourse d'un étudiant (mettre studentId à null)
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

    if (!scholarship.studentId) {
      return NextResponse.json({ error: 'Cette bourse n\'est pas attribuée à un étudiant' }, { status: 400 })
    }

    // Vérifier l'accès à l'école
    if (scholarship.student && user.role !== 'SUPER_ADMIN' && user.schoolId !== scholarship.student.schoolId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Retirer l'étudiant de la bourse
    const updatedScholarship = await prisma.scholarship.update({
      where: { id },
      data: {
        student: {
          disconnect: true
        }
      }
    })

    return NextResponse.json({
      message: 'Bourse retirée de l\'étudiant avec succès',
      scholarship: {
        ...updatedScholarship,
        amount: updatedScholarship.amount ? Number(updatedScholarship.amount) : null
      }
    })
  } catch (error) {
    console.error('Erreur PUT remove-student:', error)
    return NextResponse.json(
      { error: 'Erreur lors du retrait de la bourse' },
      { status: 500 }
    )
  }
}
