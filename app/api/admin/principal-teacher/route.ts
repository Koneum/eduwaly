import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// GET - Récupérer le prof principal d'une classe/niveau
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const niveau = searchParams.get('niveau')

    const where: Record<string, unknown> = {
      schoolId: user.schoolId,
      isPrincipal: true
    }

    if (classId) {
      where.classId = classId
    }
    if (niveau) {
      where.classId = { contains: niveau }
    }

    const principalTeachers = await prisma.enseignant.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json({ principalTeachers })
  } catch (error) {
    console.error('Error fetching principal teachers:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Assigner/Désassigner un prof principal
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que c'est un lycée
    const school = await prisma.school.findUnique({
      where: { id: user.schoolId }
    })

    if (!school) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    if (school.schoolType !== 'HIGH_SCHOOL') {
      return NextResponse.json({ 
        error: 'Le système de prof principal est réservé aux lycées' 
      }, { status: 400 })
    }

    const body = await request.json()
    const { teacherId, classId, isPrincipal } = body

    if (!teacherId) {
      return NextResponse.json({ error: 'ID enseignant manquant' }, { status: 400 })
    }

    // Vérifier que l'enseignant appartient à l'école
    const teacher = await prisma.enseignant.findFirst({
      where: {
        id: teacherId,
        schoolId: user.schoolId
      }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Enseignant non trouvé' }, { status: 404 })
    }

    // Si on assigne un prof principal, d'abord retirer le statut des autres pour cette classe
    if (isPrincipal && classId) {
      await prisma.enseignant.updateMany({
        where: {
          schoolId: user.schoolId,
          classId: classId,
          isPrincipal: true,
          id: { not: teacherId }
        },
        data: {
          isPrincipal: false,
          classId: null
        }
      })
    }

    // Mettre à jour l'enseignant
    const updatedTeacher = await prisma.enseignant.update({
      where: { id: teacherId },
      data: {
        isPrincipal: isPrincipal ?? false,
        classId: isPrincipal ? classId : null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json({ 
      teacher: updatedTeacher,
      message: isPrincipal 
        ? `${teacher.titre} ${teacher.nom} ${teacher.prenom} est maintenant prof principal`
        : `${teacher.titre} ${teacher.nom} ${teacher.prenom} n'est plus prof principal`
    })
  } catch (error) {
    console.error('Error updating principal teacher:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
