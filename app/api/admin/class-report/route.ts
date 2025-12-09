import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

// GET - Récupérer le bulletin de classe (notes agrégées)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const niveau = searchParams.get('niveau') // L1, L2, etc.
    const filiereId = searchParams.get('filiereId')
    const classId = searchParams.get('classId') // Pour lycées
    const moduleId = searchParams.get('moduleId')
    const periodId = searchParams.get('periodId') // GradingPeriod

    // Récupérer l'école pour savoir si c'est lycée ou université
    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
      select: { schoolType: true, name: true }
    })

    if (!school) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    // Construire le filtre pour les étudiants
    const studentFilter: Record<string, unknown> = {
      schoolId: user.schoolId,
      isEnrolled: true
    }

    if (niveau) {
      studentFilter.niveau = niveau
    }
    if (filiereId) {
      studentFilter.filiereId = filiereId
    }

    // Récupérer les étudiants correspondants
    const students = await prisma.student.findMany({
      where: studentFilter,
      include: {
        user: {
          select: { name: true }
        },
        filiere: {
          select: { id: true, nom: true }
        },
        evaluations: {
          where: moduleId ? { moduleId } : undefined,
          include: {
            module: {
              select: { id: true, nom: true, semestre: true }
            }
          }
        }
      },
      orderBy: [
        { filiere: { nom: 'asc' } },
        { user: { name: 'asc' } }
      ]
    })

    // Récupérer les modules pour le contexte
    const moduleFilter: Record<string, unknown> = {
      schoolId: user.schoolId
    }
    if (filiereId) {
      moduleFilter.filiereId = filiereId
    }
    if (moduleId) {
      moduleFilter.id = moduleId
    }

    const modules = await prisma.module.findMany({
      where: moduleFilter,
      select: {
        id: true,
        nom: true,
        semestre: true,
        vh: true
      },
      orderBy: { nom: 'asc' }
    })

    // Calculer les statistiques par étudiant
    const studentsWithStats = students.map(student => {
      // Grouper les évaluations par module
      const evaluationsByModule: Record<string, { 
        notes: number[], 
        total: number, 
        count: number 
      }> = {}

      student.evaluations.forEach(evaluation => {
        const moduleKey = evaluation.moduleId
        if (!evaluationsByModule[moduleKey]) {
          evaluationsByModule[moduleKey] = { notes: [], total: 0, count: 0 }
        }
        // Normaliser la note sur 20
        const normalizedNote = (evaluation.note / evaluation.maxPoints) * 20
        evaluationsByModule[moduleKey].notes.push(normalizedNote)
        evaluationsByModule[moduleKey].total += normalizedNote
        evaluationsByModule[moduleKey].count += 1
      })

      // Calculer la moyenne par module
      const moduleAverages: Record<string, number> = {}
      let totalAverage = 0
      let moduleCount = 0

      Object.entries(evaluationsByModule).forEach(([moduleId, data]) => {
        const average = data.count > 0 ? data.total / data.count : 0
        moduleAverages[moduleId] = Math.round(average * 100) / 100
        totalAverage += average
        moduleCount += 1
      })

      const generalAverage = moduleCount > 0 
        ? Math.round((totalAverage / moduleCount) * 100) / 100 
        : null

      return {
        id: student.id,
        studentNumber: student.studentNumber,
        name: student.user?.name || `${student.studentNumber}`,
        niveau: student.niveau,
        filiere: student.filiere,
        moduleAverages,
        generalAverage,
        evaluationCount: student.evaluations.length
      }
    })

    // Calculer les statistiques globales de la classe
    const validAverages = studentsWithStats
      .filter(s => s.generalAverage !== null)
      .map(s => s.generalAverage as number)

    const classStats = {
      studentCount: students.length,
      evaluatedCount: validAverages.length,
      classAverage: validAverages.length > 0 
        ? Math.round((validAverages.reduce((a, b) => a + b, 0) / validAverages.length) * 100) / 100 
        : null,
      highestAverage: validAverages.length > 0 ? Math.max(...validAverages) : null,
      lowestAverage: validAverages.length > 0 ? Math.min(...validAverages) : null,
      passRate: validAverages.length > 0 
        ? Math.round((validAverages.filter(a => a >= 10).length / validAverages.length) * 100) 
        : null
    }

    // Calculer les statistiques par module
    const moduleStats = modules.map(mod => {
      const moduleNotes = studentsWithStats
        .filter(s => s.moduleAverages[mod.id] !== undefined)
        .map(s => s.moduleAverages[mod.id])

      return {
        id: mod.id,
        nom: mod.nom,
        semestre: mod.semestre,
        vh: mod.vh,
        studentCount: moduleNotes.length,
        average: moduleNotes.length > 0 
          ? Math.round((moduleNotes.reduce((a, b) => a + b, 0) / moduleNotes.length) * 100) / 100 
          : null,
        highest: moduleNotes.length > 0 ? Math.max(...moduleNotes) : null,
        lowest: moduleNotes.length > 0 ? Math.min(...moduleNotes) : null,
        passRate: moduleNotes.length > 0 
          ? Math.round((moduleNotes.filter(n => n >= 10).length / moduleNotes.length) * 100) 
          : null
      }
    })

    // Récupérer les filières et niveaux disponibles pour les filtres
    const filieres = await prisma.filiere.findMany({
      where: { schoolId: user.schoolId },
      select: { id: true, nom: true }
    })

    const niveaux = await prisma.student.findMany({
      where: { schoolId: user.schoolId },
      select: { niveau: true },
      distinct: ['niveau']
    })

    return NextResponse.json({
      school: {
        name: school.name,
        type: school.schoolType
      },
      filters: {
        niveau,
        filiereId,
        moduleId
      },
      classStats,
      moduleStats,
      students: studentsWithStats,
      modules,
      availableFilters: {
        filieres,
        niveaux: niveaux.map(n => n.niveau)
      }
    })
  } catch (error) {
    console.error('Error fetching class report:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
