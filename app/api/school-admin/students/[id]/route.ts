import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// PUT - Modifier un étudiant
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (session.user.role !== 'SCHOOL_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { phone, niveau, roomId } = body

    // Vérifier que l'étudiant existe
    const student = await prisma.student.findUnique({
      where: { id },
      select: { schoolId: true }
    })

    if (!student) {
      return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 })
    }

    // Vérifier l'accès à l'école
    if (session.user.role !== 'SUPER_ADMIN' && session.user.schoolId !== student.schoolId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Mettre à jour l'étudiant
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        phone: phone || null,
        niveau: niveau || undefined,
        // roomId sera ajouté quand la relation sera créée dans le schéma
      }
    })

    return NextResponse.json({
      message: 'Étudiant modifié avec succès',
      student: updatedStudent
    })
  } catch (error) {
    console.error('Erreur PUT student:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification' },
      { status: 500 }
    )
  }
}
