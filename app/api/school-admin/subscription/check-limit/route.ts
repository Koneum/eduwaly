import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'
import { getPlanLimits, isLimitReached } from '@/lib/plan-limits'

/**
 * POST /api/school-admin/subscription/check-limit
 * Vérifier si une limite est atteinte
 * Body: { limitType: 'maxStudents' | 'maxTeachers' | etc. }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    
    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { limitType } = body

    if (!limitType) {
      return NextResponse.json({ error: 'limitType requis' }, { status: 400 })
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

    // Compter les ressources actuelles selon le type
    let currentCount = 0

    switch (limitType) {
      case 'maxStudents':
        currentCount = await prisma.student.count({
          where: { schoolId: user.schoolId }
        })
        break

      case 'maxTeachers':
        currentCount = await prisma.enseignant.count({
          where: { schoolId: user.schoolId }
        })
        break

      case 'maxDocuments':
        currentCount = await prisma.document.count({
          where: { schoolId: user.schoolId }
        })
        break

      default:
        return NextResponse.json({ error: 'Type de limite invalide' }, { status: 400 })
    }

    const limitReached = isLimitReached(planName, limitType, currentCount)
    const maxValue = limits[limitType as keyof typeof limits]

    return NextResponse.json({
      limitReached,
      currentCount,
      maxValue: maxValue === Infinity ? 'Illimité' : maxValue,
      canAdd: !limitReached,
      planName,
      planDisplayName: school.subscription?.plan?.displayName || 'Essai Gratuit'
    })

  } catch (error) {
    console.error('Erreur vérification limite:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
