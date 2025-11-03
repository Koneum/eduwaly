import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { moduleId } = await params

    // Récupérer le module avec la filière
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { filiere: true }
    })

    if (!module || !module.filiereId) {
      return NextResponse.json({ error: 'Module non trouvé ou sans filière' }, { status: 404 })
    }

    // Récupérer tous les étudiants de la filière
    const students = await prisma.student.findMany({
      where: {
        filiereId: module.filiereId
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        studentNumber: 'asc'
      }
    })

    return NextResponse.json({
      students: students.map(s => ({
        id: s.id,
        name: s.user?.name || 'Étudiant',
        studentNumber: s.studentNumber,
        email: s.user?.email
      }))
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
