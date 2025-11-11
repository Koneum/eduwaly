'use client'

import { ReactNode } from 'react'
import { useFeatureGate } from '@/hooks/use-plan-limits'
import { PlanUpgradeBanner } from './plan-upgrade-banner'
import { Loader2 } from 'lucide-react'

interface FeatureGateProps {
  feature: 'messaging' | 'onlinePayments' | 'scholarships' | 'advancedReports' | 'api' | 'webhooks' | 'attendanceQR' | 'attendanceBiometric' | 'smsNotifications' | 'chatRealTime' | 'importExport' | 'customDomain' | 'multiLanguage'
  children: ReactNode
  fallback?: ReactNode
  requiredPlan?: string
}

/**
 * Composant pour protéger une fonctionnalité selon le plan
 * Affiche une bannière d'upgrade si la fonctionnalité n'est pas disponible
 */
export function FeatureGate({ 
  feature, 
  children, 
  fallback,
  requiredPlan = 'Basic'
}: FeatureGateProps) {
  const { isAvailable, isLoading, planName } = useFeatureGate(feature)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAvailable) {
    if (fallback) {
      return <>{fallback}</>
    }

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

    return (
      <div className="p-4">
        <PlanUpgradeBanner
          feature={featureNames[feature] || feature}
          currentPlan={planName}
          requiredPlan={requiredPlan}
        />
      </div>
    )
  }

  return <>{children}</>
}
