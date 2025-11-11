/**
 * Hook React pour vérifier les limites et fonctionnalités du plan
 * Utilisation: const { hasFeature, isLimitReached, canAddStudent } = usePlanLimits()
 */

import { useEffect, useState } from 'react'
import { getPlanLimits, hasFeature as checkFeature, isLimitReached as checkLimit, type PlanFeatures } from '@/lib/plan-limits'

interface PlanLimitsHook {
  planName: string
  limits: ReturnType<typeof getPlanLimits>
  hasFeature: (feature: keyof PlanFeatures) => boolean
  isLimitReached: (limitType: 'maxStudents' | 'maxTeachers' | 'maxDocuments' | 'maxStorageMB' | 'maxEmails' | 'maxSMS' | 'maxCampus', currentValue: number) => boolean
  canAddStudent: (currentCount: number) => boolean
  canAddTeacher: (currentCount: number) => boolean
  canSendEmail: (currentCount: number) => boolean
  canSendSMS: (currentCount: number) => boolean
  isLoading: boolean
}

export function usePlanLimits(): PlanLimitsHook {
  const [planName, setPlanName] = useState<string>('STARTER')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Charger le plan de l'école depuis l'API
    const fetchPlan = async () => {
      try {
        const response = await fetch('/api/school-admin/subscription/current')
        if (response.ok) {
          const data = await response.json()
          setPlanName(data.planName || 'STARTER')
        }
      } catch (error) {
        console.error('Erreur chargement plan:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlan()
  }, [])

  const limits = getPlanLimits(planName)

  return {
    planName,
    limits,
    hasFeature: (feature) => checkFeature(planName, feature),
    isLimitReached: (limitType, currentValue) => checkLimit(planName, limitType, currentValue),
    canAddStudent: (currentCount) => !checkLimit(planName, 'maxStudents', currentCount),
    canAddTeacher: (currentCount) => !checkLimit(planName, 'maxTeachers', currentCount),
    canSendEmail: (currentCount) => !checkLimit(planName, 'maxEmails', currentCount),
    canSendSMS: (currentCount) => !checkLimit(planName, 'maxSMS', currentCount),
    isLoading,
  }
}

/**
 * Hook pour afficher un message d'upgrade si la fonctionnalité n'est pas disponible
 */
export function useFeatureGate(feature: keyof PlanFeatures) {
  const { hasFeature, planName, isLoading } = usePlanLimits()
  const isAvailable = hasFeature(feature)

  return {
    isAvailable,
    isLoading,
    planName,
    upgradeMessage: isAvailable
      ? null
      : `Cette fonctionnalité nécessite un plan supérieur. Votre plan actuel: ${planName}`,
  }
}
