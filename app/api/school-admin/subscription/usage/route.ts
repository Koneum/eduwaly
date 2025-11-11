import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'
import { getPlanLimits } from '@/lib/plan-limits'

/**
 * GET /api/school-admin/subscription/usage
 * Récupérer l'utilisation actuelle du plan
 */
export async function GET() {
  try {
    const user = await getAuthUser()
    
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer l'école avec son abonnement
    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      }
    })

    if (!school) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 })
    }

    const planName = school.subscription?.plan?.name || 'STARTER'
    const limits = getPlanLimits(planName)

    // Compter les ressources actuelles
    const [studentCount, teacherCount, documentCount] = await Promise.all([
      prisma.student.count({ where: { schoolId: user.schoolId } }),
      prisma.enseignant.count({ where: { schoolId: user.schoolId } }),
      prisma.document.count({ where: { schoolId: user.schoolId } })
    ])

    // Calculer les pourcentages
    const calculatePercentage = (current: number, max: number | typeof Infinity) => {
      if (max === Infinity) return 0
      return Math.round((current / max) * 100)
    }

    return NextResponse.json({
      planName,
      planDisplayName: school.subscription?.plan?.displayName || 'Essai Gratuit',
      status: school.subscription?.status || 'TRIAL',
      students: {
        current: studentCount,
        max: limits.maxStudents === Infinity ? 'Illimité' : limits.maxStudents,
        percentage: calculatePercentage(studentCount, limits.maxStudents)
      },
      teachers: {
        current: teacherCount,
        max: limits.maxTeachers === Infinity ? 'Illimité' : limits.maxTeachers,
        percentage: calculatePercentage(teacherCount, limits.maxTeachers)
      },
      documents: {
        current: documentCount,
        max: limits.maxDocuments === Infinity ? 'Illimité' : limits.maxDocuments,
        percentage: calculatePercentage(documentCount, limits.maxDocuments)
      },
      storage: {
        current: 0, // À implémenter
        max: limits.maxStorageMB === Infinity ? 'Illimité' : limits.maxStorageMB,
        percentage: 0
      }
    })

  } catch (error) {
    console.error('Erreur récupération usage:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
