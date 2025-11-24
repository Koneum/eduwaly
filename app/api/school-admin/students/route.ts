import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'
import { generateStudentEmail } from '@/lib/email-utils'
import { generateEnrollmentId } from '@/lib/enrollment-utils'
import { checkQuota } from '@/lib/subscription/quota-middleware'
import { generateStudentNumberForSchool } from '@/lib/student-utils'

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
      schoolId,
      status,
      enrollmentYear,
    } = body

    // Validation des champs obligatoires
    if (!firstName || !lastName || !studentNumber || !niveau || !schoolId) {
      return NextResponse.json({ 
        error: 'Champs obligatoires manquants: Prénom, Nom, Matricule, Niveau, École' 
      }, { status: 400 })
    }

    // Vérifier que l'utilisateur a accès à cette école
    if (user.role === 'SCHOOL_ADMIN' && user.schoolId !== schoolId) {
      return NextResponse.json({ error: 'Accès refusé à cette école' }, { status: 403 })
    }

    // Vérifier le quota d'étudiants
    const quotaCheck = await checkQuota(schoolId, 'students')
    if (!quotaCheck.allowed) {
      return NextResponse.json({
        error: 'Limite atteinte',
        message: quotaCheck.message,
        current: quotaCheck.current,
        limit: quotaCheck.limit
      }, { status: 403 })
    }

    // Récupérer les infos de l'école pour générer l'email
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true, subdomain: true, shortName: true }
    })

    if (!school) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    // Déterminer l'année de promotion (enrollmentYear)
    const promotionYear = enrollmentYear || new Date().getFullYear()

    // Vérifier l'unicité du matricule (studentNumber) pour cette école
    const existingStudentWithMatricule = await prisma.student.findFirst({
      where: {
        studentNumber,
        schoolId,
      },
    })

    if (existingStudentWithMatricule) {
      return NextResponse.json({ error: 'Ce matricule existe déjà pour cette école' }, { status: 400 })
    }

    // Générer automatiquement le code d'inscription / numéro étudiant système au format SIGLE-YYYY-0001
    const generatedEnrollmentCode = await generateStudentNumberForSchool(schoolId, promotionYear)

    // Générer l'email automatiquement: N.Prenom@ecole.com (pour information)
    const generatedEmail = generateStudentEmail(firstName, lastName, school.name)

    // Code d'inscription utilisé pour l'enrôlement (numéro étudiant système)
    const enrollmentId = generatedEnrollmentCode

    // Créer l'étudiant SANS compte (le compte sera créé lors de l'enrôlement)
    const student = await prisma.student.create({
      data: {
        schoolId,
        studentNumber,
        enrollmentId,
        niveau,
        enrollmentYear: promotionYear,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address: address || null,
        phone: phone || null,
        filiereId: filiereId || null,
        status: status || null,
        isEnrolled: false, // Pas encore enrôlé
        userId: null // Pas de compte utilisateur
      },
      include: {
        filiere: true
      }
    })

    // Vérifier si un parent existe déjà avec cet enrollmentId (pour les fratries)
    let parent = await prisma.parent.findUnique({
      where: { enrollmentId }
    })

    if (parent) {
      // Un parent existe déjà (fratrie) - lier l'étudiant à ce parent
      await prisma.parent.update({
        where: { id: parent.id },
        data: {
          students: {
            connect: { id: student.id }
          }
        }
      })
    } else {
      // Créer un nouveau parent avec cet enrollmentId
      parent = await prisma.parent.create({
        data: {
          enrollmentId,
          isEnrolled: false,
          userId: null,
          students: {
            connect: { id: student.id }
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      student,
      parent: {
        id: parent.id,
        enrollmentId: parent.enrollmentId,
        isNew: !parent.userId // Indique si c'est un nouveau parent ou existant
      },
      enrollmentId,
      generatedEmail,
      message: parent.userId 
        ? `Étudiant créé et lié au parent existant. ID d'enrôlement: ${enrollmentId}. Email suggéré: ${generatedEmail}`
        : `Étudiant et parent créés. ID d'enrôlement: ${enrollmentId}. Email suggéré: ${generatedEmail}`
    })

  } catch (error) {
    console.error('Erreur création étudiant:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'étudiant' },
      { status: 500 }
    )
  }
}
