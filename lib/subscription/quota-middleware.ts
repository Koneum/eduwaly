import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-utils'

export interface QuotaCheck {
  allowed: boolean
  message?: string
  current?: number
  limit?: number
}

/**
 * Vérifie si l'école a atteint ses limites d'abonnement
 */
export async function checkQuota(
  schoolId: string,
  resource: 'students' | 'teachers' | 'storage'
): Promise<QuotaCheck> {
  try {
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

    if (!school || !school.subscription || !school.subscription.plan) {
      return {
        allowed: false,
        message: 'Aucun abonnement actif'
      }
    }

    const { subscription } = school
    const { plan } = subscription

    // Vérifier le statut de l'abonnement
    if (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIAL') {
      return {
        allowed: false,
        message: `Abonnement ${subscription.status}. Veuillez renouveler votre abonnement.`
      }
    }

    // Vérifier les limites selon le type de ressource
    switch (resource) {
      case 'students': {
        const studentCount = await prisma.student.count({
          where: { schoolId }
        })
        const limit = plan.maxStudents
        
        if (studentCount >= limit) {
          return {
            allowed: false,
            message: `Limite d'étudiants atteinte (${limit}). Passez à un plan supérieur.`,
            current: studentCount,
            limit
          }
        }
        
        return {
          allowed: true,
          current: studentCount,
          limit
        }
      }

      case 'teachers': {
        const teacherCount = await prisma.enseignant.count({
          where: { schoolId }
        })
        const limit = plan.maxTeachers
        
        if (teacherCount >= limit) {
          return {
            allowed: false,
            message: `Limite d'enseignants atteinte (${limit}). Passez à un plan supérieur.`,
            current: teacherCount,
            limit
          }
        }
        
        return {
          allowed: true,
          current: teacherCount,
          limit
        }
      }

      case 'storage': {
        // Pour l'instant, pas de limite de stockage
        return { allowed: true }
      }

      default:
        return { allowed: true }
    }
  } catch (error) {
    console.error('Erreur vérification quota:', error)
    return {
      allowed: false,
      message: 'Erreur lors de la vérification des quotas'
    }
  }
}

/**
 * Middleware pour protéger les routes avec vérification de quota
 */
export async function withQuotaCheck(
  request: NextRequest,
  resource: 'students' | 'teachers' | 'storage'
) {
  try {
    const user = await getAuthUser()
    
    if (!user || !user.schoolId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const quotaCheck = await checkQuota(user.schoolId, resource)

    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Limite atteinte',
          message: quotaCheck.message,
          current: quotaCheck.current,
          limit: quotaCheck.limit
        },
        { status: 403 }
      )
    }

    return null // Autorisé
  } catch (error) {
    console.error('Erreur middleware quota:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
