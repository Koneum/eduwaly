import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { validateEnrollmentId } from '@/lib/enrollment-utils'

export async function POST(request: NextRequest) {
  try {
    const { enrollmentId, userType } = await request.json()

    // Valider le format de l'ID
    if (!validateEnrollmentId(enrollmentId)) {
      return NextResponse.json(
        { error: 'Format d\'ID invalide' },
        { status: 400 }
      )
    }

    if (userType === 'student') {
      // Vérifier si l'ID existe pour un étudiant
      const student = await prisma.student.findUnique({
        where: { enrollmentId },
        include: {
          school: true,
          filiere: true
        }
      })

      if (!student) {
        return NextResponse.json(
          { error: 'ID d\'enrôlement non trouvé' },
          { status: 404 }
        )
      }

      if (student.isEnrolled) {
        return NextResponse.json(
          { error: 'Cet étudiant est déjà enrôlé' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          studentNumber: student.studentNumber,
          niveau: student.niveau,
          filiere: student.filiere?.nom || 'Non assigné',
          schoolName: student.school.name,
          schoolType: student.school.schoolType,
          schoolId: student.school.id,
          studentId: student.id
        }
      })
    } else if (userType === 'parent') {
      // Vérifier si l'ID existe pour un parent
      const parent = await prisma.parent.findUnique({
        where: { enrollmentId },
        include: {
          students: {
            include: {
              school: true,
              filiere: true
            }
          }
        }
      })

      if (!parent) {
        return NextResponse.json(
          { error: 'ID d\'enrôlement non trouvé' },
          { status: 404 }
        )
      }

      if (parent.isEnrolled) {
        return NextResponse.json(
          { error: 'Ce parent est déjà enrôlé' },
          { status: 400 }
        )
      }

      const student = parent.students[0]
      if (!student) {
        return NextResponse.json(
          { error: 'Aucun étudiant associé' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          studentNumber: student.studentNumber,
          niveau: student.niveau,
          filiere: student.filiere?.nom || 'Non assigné',
          schoolName: student.school.name,
          schoolType: student.school.schoolType,
          schoolId: student.school.id,
          parentId: parent.id
        }
      })
    }

    return NextResponse.json(
      { error: 'Type d\'utilisateur invalide' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error verifying enrollment ID:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
