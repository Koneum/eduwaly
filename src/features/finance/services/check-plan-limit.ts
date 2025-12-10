/**
 * Middleware pour vérifier les limites du plan
 * Utilisé dans les API routes pour bloquer les actions si limite atteinte
 */

import prisma from '@/lib/prisma'
import { getPlanLimits, isLimitReached, hasFeature } from '@/lib/plan-limits'
import type { PlanFeatures } from '@/lib/plan-limits'

interface CheckLimitResult {
  allowed: boolean
  error?: string
  currentCount?: number
  maxValue?: number | typeof Infinity
  planName?: string
}

/**
 * Vérifier si l'école peut ajouter une ressource
 */
export async function checkCanAddResource(
  schoolId: string,
  resourceType: 'student' | 'teacher' | 'document'
): Promise<CheckLimitResult> {
  try {
    // Récupérer le plan de l'école
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

    if (!school) {
      return { allowed: false, error: 'École non trouvée' }
    }

    const planName = school.subscription?.plan?.name || 'STARTER'
    const limits = getPlanLimits(planName)

    // Compter les ressources actuelles
    let currentCount = 0
    let limitType: 'maxStudents' | 'maxTeachers' | 'maxDocuments'

    switch (resourceType) {
      case 'student':
        currentCount = await prisma.student.count({ where: { schoolId } })
        limitType = 'maxStudents'
        break

      case 'teacher':
        currentCount = await prisma.enseignant.count({ where: { schoolId } })
        limitType = 'maxTeachers'
        break

      case 'document':
        currentCount = await prisma.document.count({ where: { schoolId } })
        limitType = 'maxDocuments'
        break

      default:
        return { allowed: false, error: 'Type de ressource invalide' }
    }

    const limitReached = isLimitReached(planName, limitType, currentCount)
    const maxValue = limits[limitType]

    if (limitReached) {
      const resourceNames = {
        student: 'étudiants',
        teacher: 'enseignants',
        document: 'documents'
      }

      return {
        allowed: false,
        error: `Limite de ${resourceNames[resourceType]} atteinte (${currentCount}/${maxValue}). Veuillez mettre à niveau votre plan.`,
        currentCount,
        maxValue,
        planName
      }
    }

    return {
      allowed: true,
      currentCount,
      maxValue,
      planName
    }

  } catch (error) {
    console.error('Erreur vérification limite:', error)
    return { allowed: false, error: 'Erreur lors de la vérification' }
  }
}

/**
 * Vérifier si une fonctionnalité est disponible
 */
export async function checkFeatureAccess(
  schoolId: string,
  feature: keyof PlanFeatures
): Promise<CheckLimitResult> {
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

    if (!school) {
      return { allowed: false, error: 'École non trouvée' }
    }

    const planName = school.subscription?.plan?.name || 'STARTER'
    const isAvailable = hasFeature(planName, feature)

    if (!isAvailable) {
      const featureNames: Record<string, string> = {
        messaging: 'Messagerie interne',
        onlinePayments: 'Paiements en ligne',
        scholarships: 'Gestion des bourses',
        advancedReports: 'Rapports avancés',
        api: 'Accès API',
        webhooks: 'Webhooks',
        attendanceQR: 'Pointage QR Code',
        attendanceBiometric: 'Pointage biométrique',
        smsNotifications: 'Notifications SMS',
        chatRealTime: 'Chat en temps réel',
        importExport: 'Import/Export',
        customDomain: 'Domaine personnalisé',
        multiLanguage: 'Multi-langues'
      }

      return {
        allowed: false,
        error: `${featureNames[feature] || feature} n'est pas disponible dans votre plan (${planName}). Veuillez mettre à niveau.`,
        planName
      }
    }

    return { allowed: true, planName }

  } catch (error) {
    console.error('Erreur vérification fonctionnalité:', error)
    return { allowed: false, error: 'Erreur lors de la vérification' }
  }
}

/**
 * Vérifier si l'abonnement est actif
 */
export async function checkSubscriptionActive(schoolId: string): Promise<CheckLimitResult> {
  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        subscription: true
      }
    })

    if (!school) {
      return { allowed: false, error: 'École non trouvée' }
    }

    if (!school.subscription) {
      // Pas d'abonnement = plan STARTER par défaut
      return { allowed: true, planName: 'STARTER' }
    }

    const now = new Date()
    const subscription = school.subscription

    // Vérifier le statut
    if (subscription.status === 'CANCELED') {
      return { allowed: false, error: 'Abonnement annulé' }
    }

    // Vérifier la période d'essai
    if (subscription.status === 'TRIAL' && subscription.trialEndsAt && subscription.trialEndsAt < now) {
      return { allowed: false, error: 'Période d\'essai expirée' }
    }

    // Vérifier la période de paiement
    if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < now) {
      return { allowed: false, error: 'Abonnement expiré' }
    }

    return { allowed: true }

  } catch (error) {
    console.error('Erreur vérification abonnement:', error)
    return { allowed: false, error: 'Erreur lors de la vérification' }
  }
}
