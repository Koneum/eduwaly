import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'
import { generateStudentEmail } from '@/lib/email-utils'
import { generateEnrollmentId } from '@/lib/enrollment-utils'

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
      dateOfBirth, 
      address, 
      studentNumber, 
      niveau, 
      phone,
      filiereId,
      schoolId
    } = body

    // Validation des champs obligatoires
    if (!firstName || !lastName || !studentNumber || !niveau) {
      return NextResponse.json({ 
        error: 'Champs obligatoires manquants: Prénom, Nom, Matricule, Niveau' 
      }, { status: 400 })
    }

    // Vérifier que l'utilisateur a accès à cette école
    if (user.role === 'SCHOOL_ADMIN' && user.schoolId !== schoolId) {
      return NextResponse.json({ error: 'Accès refusé à cette école' }, { status: 403 })
    }

    // Récupérer les infos de l'école pour générer l'email
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true, subdomain: true }
    })

    if (!school) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    // Vérifier si le matricule existe déjà
    const existingStudent = await prisma.student.findFirst({
      where: {
        studentNumber,
        schoolId
      }
    })

    if (existingStudent) {
      return NextResponse.json({ error: 'Ce matricule existe déjà' }, { status: 400 })
    }

    // Générer l'email automatiquement: N.Prenom@ecole.com (pour information)
    const generatedEmail = generateStudentEmail(firstName, lastName, school.name)

    // Générer un enrollmentId unique au format ENR-YYYY-XXXXX
    const enrollmentId = generateEnrollmentId()

    // Créer l'étudiant SANS compte (le compte sera créé lors de l'enrôlement)
    const student = await prisma.student.create({
      data: {
        schoolId,
        studentNumber,
        enrollmentId,
        niveau,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address: address || null,
        phone: phone || null,
        filiereId: filiereId || null,
        isEnrolled: false, // Pas encore enrôlé
        userId: null // Pas de compte utilisateur
      },
      include: {
        filiere: true
      }
    })

    return NextResponse.json({
      success: true,
      student,
      enrollmentId,
      generatedEmail, // Email qui sera utilisé lors de l'enrôlement
      message: `Étudiant créé. ID d'enrôlement: ${enrollmentId}. Email suggéré: ${generatedEmail}`
    })

  } catch (error) {
    console.error('Erreur création étudiant:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'étudiant' },
      { status: 500 }
    )
  }
}
