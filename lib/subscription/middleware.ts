import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { PlanLimits } from '@/types/subscription'
import { isLimitExceeded, getPlanLimits } from '@/lib/subscription/features'

/**
 * Vérifie si une école peut ajouter un nouvel élément selon ses limites
 */
export async function checkSchoolLimit(
  schoolId: string,
  limitType: keyof PlanLimits
): Promise<{ allowed: boolean; current: number; limit: number; message?: string }> {
  try {
    // Récupérer l'abonnement de l'école
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      }
    })

    if (!school || !school.subscription) {
      return {
        allowed: false,
        current: 0,
        limit: 0,
        message: 'Aucun abonnement actif trouvé'
      }
    }

    const planName = school.subscription.plan.name as any
    const limits = getPlanLimits(planName)
    const limit = limits[limitType]

    // -1 signifie illimité
    if (limit === -1) {
      return { allowed: true, current: 0, limit: -1 }
    }

    // Compter les éléments actuels selon le type
    let currentCount = 0

    switch (limitType) {
      case 'maxStudents':
        currentCount = await prisma.student.count({ where: { schoolId } })
        break
      case 'maxTeachers':
        currentCount = await prisma.user.count({
          where: { schoolId, role: 'TEACHER' }
        })
        break
      case 'maxAdminStaff':
        currentCount = await prisma.user.count({
          where: {
            schoolId,
            role: { in: ['SCHOOL_ADMIN', 'MANAGER', 'SECRETARY', 'ASSISTANT', 'PERSONNEL'] }
          }
        })
        break
      case 'maxClasses':
        currentCount = await prisma.filiere.count({ where: { schoolId } })
        break
      case 'maxModules':
        currentCount = await prisma.module.count({ where: { schoolId } })
        break
      case 'maxRooms':
        currentCount = await prisma.room.count({ where: { schoolId } })
        break
      case 'storageGB':
        // TODO: Calculer l'espace de stockage utilisé
        currentCount = 0
        break
      default:
        currentCount = 0
    }

    const exceeded = isLimitExceeded(planName, limitType, currentCount)

    return {
      allowed: !exceeded,
      current: currentCount,
      limit,
      message: exceeded ? `Limite de ${limit} atteinte. Veuillez mettre à niveau votre plan.` : undefined
    }
  } catch (error) {
    console.error('Error checking school limit:', error)
    return {
      allowed: false,
      current: 0,
      limit: 0,
      message: 'Erreur lors de la vérification des limites'
    }
  }
}

/**
 * Middleware helper pour vérifier les limites dans les API routes
 */
export async function withLimitCheck(
  schoolId: string,
  limitType: keyof PlanLimits,
  action: () => Promise<NextResponse>
): Promise<NextResponse> {
  const check = await checkSchoolLimit(schoolId, limitType)

  if (!check.allowed) {
    return NextResponse.json(
      {
        error: check.message || 'Limite atteinte',
        current: check.current,
        limit: check.limit
      },
      { status: 403 }
    )
  }

  return action()
}
