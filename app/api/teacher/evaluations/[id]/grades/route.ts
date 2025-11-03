import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// PUT - Mettre à jour les notes
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { grades } = body

    if (!grades || !Array.isArray(grades)) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    // Mettre à jour les notes en batch
    const updates = grades.map(grade => {
      return prisma.evaluation.updateMany({
        where: {
          moduleId: id,
          studentId: grade.id
        },
        data: {
          note: grade.isAbsent ? null : (grade.note !== undefined ? grade.note : null)
        }
      })
    })

    await prisma.$transaction(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour des notes' 
    }, { status: 500 })
  }
}
