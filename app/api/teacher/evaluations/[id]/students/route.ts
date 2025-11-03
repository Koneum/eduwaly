import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// GET - Récupérer les étudiants pour une évaluation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    // Récupérer l'évaluation avec les notes existantes
    const evaluations = await prisma.evaluation.findMany({
      where: {
        moduleId: id
      },
      include: {
        student: {
          include: {
            user: true
          }
        }
      }
    })

    if (evaluations.length === 0) {
      return NextResponse.json({ 
        error: 'Aucune évaluation trouvée',
        students: []
      }, { status: 404 })
    }

    // Formater les données pour l'interface
    const students = evaluations.map(evaluation => ({
      id: evaluation.studentId,
      name: evaluation.student.user?.name || 'Nom inconnu',
      studentNumber: evaluation.student.studentNumber,
      note: evaluation.note ? Number(evaluation.note) : undefined,
      isAbsent: evaluation.note === null || evaluation.note === undefined
    }))

    return NextResponse.json({ students })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur',
      students: []
    }, { status: 500 })
  }
}
