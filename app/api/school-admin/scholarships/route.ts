import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'

// GET - Récupérer les bourses
export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')

    if (!schoolId) {
      return NextResponse.json({ error: 'schoolId requis' }, { status: 400 })
    }

    // Vérifier l'accès à l'école
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== schoolId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const scholarships = await prisma.scholarship.findMany({
      where: {
        student: {
          schoolId
        }
      },
      include: {
        student: {
          select: {
            studentNumber: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Convertir les Decimal en number
    const serialized = scholarships.map(s => ({
      ...s,
      amount: s.amount ? Number(s.amount) : null
    }))

    return NextResponse.json(serialized)
  } catch (error) {
    console.error('Erreur GET scholarships:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}

// POST - Créer une bourse (avec ou sans étudiant)
export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { studentId, schoolId, name, type, percentage, amount, reason, description } = body

    // Validation
    if (!name || !type || (!percentage && !amount)) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants (name, type, percentage ou amount)' },
        { status: 400 }
      )
    }

    // Si studentId fourni, vérifier que l'étudiant existe
    let targetSchoolId = schoolId
    if (studentId) {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { schoolId: true }
      })

      if (!student) {
        return NextResponse.json({ error: 'Étudiant non trouvé' }, { status: 404 })
      }
      targetSchoolId = student.schoolId
    }

    // Vérifier l'accès à l'école
    if (user.role !== 'SUPER_ADMIN' && user.schoolId !== targetSchoolId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Créer la bourse
    const scholarship = await prisma.scholarship.create({
      data: {
        schoolId: targetSchoolId,
        studentId: studentId || null,
        name,
        type,
        percentage: percentage ? parseFloat(percentage) : null,
        amount: amount ? parseFloat(amount) : null,
        reason: reason || description || 'Non spécifié',
        academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
      }
    })

    return NextResponse.json({
      message: studentId ? 'Bourse appliquée avec succès' : 'Bourse créée avec succès',
      scholarship: {
        ...scholarship,
        amount: scholarship.amount ? Number(scholarship.amount) : null
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Erreur POST scholarship:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la bourse' },
      { status: 500 }
    )
  }
}
