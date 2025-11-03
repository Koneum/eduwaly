import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// POST - Créer une évaluation
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    
    console.log('User:', user?.id, 'Role:', user?.role)
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    
    // Accepter TEACHER et SCHOOL_ADMIN pour les tests
    if (user.role !== 'TEACHER' && user.role !== 'SCHOOL_ADMIN') {
      return NextResponse.json({ 
        error: 'Non autorisé - rôle requis: TEACHER',
        currentRole: user.role 
      }, { status: 401 })
    }

    const body = await request.json()
    const { type, subject, coefficient, classId, date, moduleId } = body

    console.log('Données reçues:', { type, subject, coefficient, classId, date, moduleId })

    if (!type || !subject || !classId || !date) {
      return NextResponse.json({ 
        error: 'Champs obligatoires manquants',
        received: { type, subject, classId, date }
      }, { status: 400 })
    }

    // Vérifier que l'enseignant existe (ou utiliser schoolId si admin)
    let schoolId = user.schoolId
    
    if (user.role === 'TEACHER') {
      const teacher = await prisma.enseignant.findFirst({
        where: { userId: user.id }
      })

      if (!teacher) {
        return NextResponse.json({ error: 'Enseignant non trouvé' }, { status: 404 })
      }
      schoolId = teacher.schoolId
    }
    
    if (!schoolId) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    // Créer le module si nécessaire ou utiliser un existant
    let targetModuleId = moduleId
    
    if (!targetModuleId) {
      // Créer un module temporaire pour cette évaluation
      const createdModule = await prisma.module.create({
        data: {
          nom: subject,
          type: 'COURS',
          vh: 0,
          semestre: 'S1',
          schoolId: schoolId,
          filiereId: classId
        }
      })
      targetModuleId = createdModule.id
    }

    // Récupérer les étudiants de la classe/filière
    console.log('Recherche étudiants avec:', { filiereId: classId, schoolId })
    
    const students = await prisma.student.findMany({
      where: {
        filiereId: classId,
        schoolId: schoolId
      }
    })

    console.log('Étudiants trouvés:', students.length)

    if (students.length === 0) {
      // Créer quand même le module pour permettre l'ajout d'étudiants plus tard
      return NextResponse.json({ 
        success: true,
        message: 'Évaluation créée (aucun étudiant dans cette classe/filière pour le moment)',
        warning: 'Aucun étudiant trouvé. Ajoutez des étudiants à cette classe/filière pour saisir les notes.',
        moduleId: targetModuleId
      }, { status: 201 })
    }

    // Créer les évaluations pour tous les étudiants
    const evaluations = await prisma.$transaction(
      students.map(student =>
        prisma.evaluation.create({
          data: {
            studentId: student.id,
            moduleId: targetModuleId,
            type,
            date: new Date(date),
            note: 0, // Note par défaut à 0, à modifier ensuite
            coefficient: coefficient ? parseFloat(coefficient) : 1
          }
        })
      )
    )

    return NextResponse.json({ 
      success: true,
      evaluations,
      message: `${evaluations.length} évaluation${evaluations.length > 1 ? 's' : ''} créée${evaluations.length > 1 ? 's' : ''}`
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur création évaluation:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur' 
    }, { status: 500 })
  }
}
