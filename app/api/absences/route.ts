import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// GET - Récupérer les absences
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const date = searchParams.get('date')

    // Filtrer par école (sauf SUPER_ADMIN)
    const where: Record<string, unknown> = user.role === 'SUPER_ADMIN' 
      ? {} 
      : { student: { schoolId: user.schoolId } }
    
    if (studentId) where.studentId = studentId
    if (date) where.date = new Date(date)

    // ✅ OPTIMISÉ: Select précis au lieu de include profond
    const absences = await prisma.absence.findMany({
      where,
      select: {
        id: true,
        date: true,
        justified: true,
        justification: true,
        moduleId: true,
        notifiedParent: true,
        studentId: true,
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
                name: true,
                email: true
              }
            },
            filiere: {
              select: {
                id: true,
                nom: true
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({ absences })
  } catch (error) {
    console.error('Error fetching absences:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer une absence
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || (user.role !== 'TEACHER' && user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { studentId, date, justified, justification, moduleId } = body

    if (!studentId || !date) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Vérifier que l'étudiant appartient à l'école de l'utilisateur
    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) {
      return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 })
    }
    if (user.role !== 'SUPER_ADMIN' && student.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const absence = await prisma.absence.create({
      data: {
        studentId,
        date: new Date(date),
        justified: justified || false,
        justification: justification || null,
        moduleId: moduleId || null,
        notifiedParent: false
      },
      include: {
        student: {
          include: {
            user: true
          }
        }
      }
    })

    return NextResponse.json({ absence }, { status: 201 })
  } catch (error) {
    console.error('Error creating absence:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour une absence
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || (user.role !== 'TEACHER' && user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { id, justified, justification } = body

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    // Vérifier que l'absence appartient à l'école
    const existingAbsence = await prisma.absence.findUnique({
      where: { id },
      include: { student: true }
    })
    if (!existingAbsence) {
      return NextResponse.json({ error: 'Absence non trouvée' }, { status: 404 })
    }
    if (user.role !== 'SUPER_ADMIN' && existingAbsence.student.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const absence = await prisma.absence.update({
      where: { id },
      data: {
        justified,
        justification
      }
    })

    return NextResponse.json({ absence })
  } catch (error) {
    console.error('Error updating absence:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer une absence
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || (user.role !== 'TEACHER' && user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    // Vérifier que l'absence appartient à l'école
    const absence = await prisma.absence.findUnique({
      where: { id },
      include: { student: true }
    })
    if (!absence) {
      return NextResponse.json({ error: 'Absence non trouvée' }, { status: 404 })
    }
    if (user.role !== 'SUPER_ADMIN' && absence.student.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    await prisma.absence.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting absence:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
