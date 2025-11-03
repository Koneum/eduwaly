import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'
import { generateEnrollmentId } from '@/lib/enrollment-utils'

// POST: Créer un parent (sans compte, juste avec enrollmentId)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    
    if (!user || (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      firstName,
      lastName,
      phone,
      address,
      occupation,
      studentIds, // Array d'IDs d'étudiants à associer
      schoolId 
    } = body

    // Validation des champs obligatoires
    if (!firstName || !lastName || !studentIds || studentIds.length === 0) {
      return NextResponse.json({ 
        error: 'Champs obligatoires manquants: Prénom, Nom, et au moins un étudiant' 
      }, { status: 400 })
    }

    // Vérifier que l'utilisateur a accès à cette école
    if (user.role === 'SCHOOL_ADMIN' && user.schoolId !== schoolId) {
      return NextResponse.json({ error: 'Accès refusé à cette école' }, { status: 403 })
    }

    // Vérifier que tous les étudiants existent et appartiennent à cette école
    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        schoolId
      },
      select: {
        id: true,
        studentNumber: true
      }
    })

    if (students.length !== studentIds.length) {
      return NextResponse.json({ 
        error: 'Un ou plusieurs étudiants n\'existent pas ou n\'appartiennent pas à cette école' 
      }, { status: 400 })
    }

    // Générer un enrollmentId unique au format ENR-YYYY-XXXXX
    const enrollmentId = generateEnrollmentId()

    // Créer le parent sans compte utilisateur
    const parent = await prisma.parent.create({
      data: {
        enrollmentId,
        phone: phone || null,
        address: address || null,
        occupation: occupation || null,
        isEnrolled: false, // Pas encore enrôlé
        userId: null, // Pas de compte utilisateur
        students: {
          connect: studentIds.map((id: string) => ({ id }))
        }
      },
      include: {
        students: {
          include: {
            user: {
              select: {
                name: true
              }
            },
            filiere: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      parent,
      enrollmentId,
      message: `Parent créé. ID d'enrôlement: ${enrollmentId}. Le parent peut maintenant créer son compte.`,
      studentNames: students.map(s => s.studentNumber).join(', ')
    })

  } catch (error) {
    console.error('Erreur création parent:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du parent' },
      { status: 500 }
    )
  }
}

// GET: Récupérer tous les parents d'une école
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    
    if (!user || (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')

    if (!schoolId) {
      return NextResponse.json({ error: 'schoolId requis' }, { status: 400 })
    }

    // Vérifier l'accès
    if (user.role === 'SCHOOL_ADMIN' && user.schoolId !== schoolId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const parents = await prisma.parent.findMany({
      where: {
        students: {
          some: {
            schoolId
          }
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        students: {
          include: {
            user: {
              select: {
                name: true
              }
            },
            filiere: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ parents })

  } catch (error) {
    console.error('Erreur récupération parents:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des parents' },
      { status: 500 }
    )
  }
}
