'use client'

import { useEffect, useState } from 'react'
import { PlanName, FeatureFlag, PlanLimits } from '@/types/subscription'
import { hasFeature, getPlanLimits, isLimitExceeded, getLimitUsagePercentage } from '@/lib/subscription/features'

interface SubscriptionData {
  planName: PlanName
  limits: PlanLimits
  trialEndsAt?: Date
  currentPeriodEnd: Date
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID'
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/subscription/current')
        if (response.ok) {
          const data = await response.json()
          setSubscription(data)
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  const checkFeature = (feature: FeatureFlag): boolean => {
    if (!subscription) return false
    return hasFeature(subscription.planName, feature)
  }

  const checkLimit = (limitType: keyof PlanLimits, currentValue: number): boolean => {
    if (!subscription) return true // Bloqué si pas d'abonnement
    return isLimitExceeded(subscription.planName, limitType, currentValue)
  }

  const getLimitPercentage = (limitType: keyof PlanLimits, currentValue: number): number => {
    if (!subscription) return 100
    return getLimitUsagePercentage(subscription.planName, limitType, currentValue)
  }

  return {
    subscription,
    loading,
    checkFeature,
    checkLimit,
    getLimitPercentage,
    isActive: subscription?.status === 'ACTIVE' || subscription?.status === 'TRIAL',
  }
}
