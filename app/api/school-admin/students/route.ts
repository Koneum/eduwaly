import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'
import { generateStudentEmail } from '@/lib/email-utils'
import bcrypt from 'bcryptjs'

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

    // Générer l'email automatiquement: N.Prenom@ecole.com
    const generatedEmail = generateStudentEmail(firstName, lastName, school.name)

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: generatedEmail }
    })

    if (existingUser) {
      return NextResponse.json({ 
        error: `L'email ${generatedEmail} existe déjà. Veuillez modifier le nom ou prénom.` 
      }, { status: 400 })
    }

    // Générer un enrollmentId unique
    const enrollmentId = `ENR-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`

    // Générer un mot de passe temporaire (le matricule)
    const hashedPassword = await bcrypt.hash(studentNumber, 10)

    // Créer l'utilisateur et l'étudiant dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'utilisateur
      const newUser = await tx.user.create({
        data: {
          name: `${firstName} ${lastName}`,
          email: generatedEmail,
          password: hashedPassword,
          role: 'STUDENT',
          schoolId,
          isActive: true
        }
      })

      // Créer l'étudiant
      const student = await tx.student.create({
        data: {
          schoolId,
          userId: newUser.id,
          studentNumber,
          enrollmentId,
          niveau,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          address: address || null,
          phone: phone || null,
          filiereId: filiereId || null,
          isEnrolled: true, // Compte créé automatiquement
        },
        include: {
          filiere: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })

      return { user: newUser, student }
    })

    return NextResponse.json({
      success: true,
      student: result.student,
      credentials: {
        email: generatedEmail,
        password: studentNumber, // Mot de passe temporaire = matricule
        enrollmentId
      },
      message: `Étudiant créé avec succès. Email: ${generatedEmail}, Mot de passe: ${studentNumber}`
    })

  } catch (error) {
    console.error('Erreur création étudiant:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'étudiant' },
      { status: 500 }
    )
  }
}
