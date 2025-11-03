# Script pour créer les composants et middleware du système d'abonnement
# Partie 2 - Optimisé pour réduire l'utilisation des crédits

Write-Host "🚀 Création des composants et middleware..." -ForegroundColor Cyan

# 1. Hook React pour vérifier les features
Write-Host "`n📝 Création du hook useSubscription..." -ForegroundColor Yellow
$hookContent = @'
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
'@

Set-Content -Path "d:\react\UE-GI app\schooly\lib\subscription\useSubscription.ts" -Value $hookContent
Write-Host "✅ lib/subscription/useSubscription.ts créé" -ForegroundColor Green

# 2. Composant FeatureGate
Write-Host "`n📝 Création du composant FeatureGate..." -ForegroundColor Yellow
$featureGateContent = @'
'use client'

import { ReactNode } from 'react'
import { FeatureFlag } from '@/types/subscription'
import { useSubscription } from '@/lib/subscription/useSubscription'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface FeatureGateProps {
  feature: FeatureFlag
  children: ReactNode
  fallback?: ReactNode
  showUpgrade?: boolean
}

export function FeatureGate({ feature, children, fallback, showUpgrade = true }: FeatureGateProps) {
  const { checkFeature, subscription } = useSubscription()

  if (checkFeature(feature)) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (!showUpgrade) {
    return null
  }

  return (
    <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
      <Lock className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-900 dark:text-orange-100">
        Fonctionnalité Premium
      </AlertTitle>
      <AlertDescription className="text-orange-800 dark:text-orange-200">
        Cette fonctionnalité n'est pas disponible dans votre plan actuel ({subscription?.planName}).
        <div className="mt-2">
          <Link href={`/admin/${subscription?.planName}/subscription`}>
            <Button size="sm" variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-100">
              Mettre à niveau
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  )
}
'@

Set-Content -Path "d:\react\UE-GI app\schooly\components\subscription\FeatureGate.tsx" -Value $featureGateContent
Write-Host "✅ components/subscription/FeatureGate.tsx créé" -ForegroundColor Green

# 3. Composant LimitWarning
Write-Host "`n📝 Création du composant LimitWarning..." -ForegroundColor Yellow
$limitWarningContent = @'
'use client'

import { PlanLimits } from '@/types/subscription'
import { useSubscription } from '@/lib/subscription/useSubscription'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface LimitWarningProps {
  limitType: keyof PlanLimits
  currentValue: number
  schoolId: string
}

export function LimitWarning({ limitType, currentValue, schoolId }: LimitWarningProps) {
  const { getLimitPercentage, subscription } = useSubscription()

  const percentage = getLimitPercentage(limitType, currentValue)
  const limit = subscription?.limits[limitType] || 0

  // Ne rien afficher si < 80%
  if (percentage < 80) return null

  const isExceeded = percentage >= 100
  const limitNames: Record<keyof PlanLimits, string> = {
    maxStudents: 'étudiants',
    maxTeachers: 'enseignants',
    maxAdminStaff: 'personnel administratif',
    maxClasses: 'classes',
    maxModules: 'modules',
    maxRooms: 'salles',
    storageGB: 'GB de stockage',
    emailsPerMonth: 'emails ce mois',
    smsPerMonth: 'SMS ce mois',
    maxCampus: 'campus',
  }

  return (
    <Alert className={isExceeded ? "border-red-200 bg-red-50 dark:bg-red-950/20" : "border-orange-200 bg-orange-50 dark:bg-orange-950/20"}>
      <AlertTriangle className={`h-4 w-4 ${isExceeded ? 'text-red-600' : 'text-orange-600'}`} />
      <AlertTitle className={isExceeded ? 'text-red-900 dark:text-red-100' : 'text-orange-900 dark:text-orange-100'}>
        {isExceeded ? 'Limite atteinte' : 'Limite bientôt atteinte'}
      </AlertTitle>
      <AlertDescription className={isExceeded ? 'text-red-800 dark:text-red-200' : 'text-orange-800 dark:text-orange-200'}>
        Vous avez utilisé {currentValue} / {limit} {limitNames[limitType]} ({percentage.toFixed(0)}%).
        {isExceeded && ' Vous ne pouvez plus ajouter de nouveaux éléments.'}
        <div className="mt-2">
          <Link href={`/admin/${schoolId}/subscription`}>
            <Button size="sm" variant="outline" className={`${isExceeded ? 'border-red-600 text-red-600 hover:bg-red-100' : 'border-orange-600 text-orange-600 hover:bg-orange-100'}`}>
              Augmenter la limite
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  )
}
'@

Set-Content -Path "d:\react\UE-GI app\schooly\components\subscription\LimitWarning.tsx" -Value $limitWarningContent
Write-Host "✅ components/subscription/LimitWarning.tsx créé" -ForegroundColor Green

# 4. Middleware de vérification
Write-Host "`n📝 Création du middleware de vérification..." -ForegroundColor Yellow
$middlewareContent = @'
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
'@

Set-Content -Path "d:\react\UE-GI app\schooly\lib\subscription\middleware.ts" -Value $middlewareContent
Write-Host "✅ lib/subscription/middleware.ts créé" -ForegroundColor Green

# 5. API pour récupérer l'abonnement actuel
Write-Host "`n📝 Création de l'API subscription..." -ForegroundColor Yellow
$apiContent = @'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'
import { PLAN_CONFIGS } from '@/types/subscription'

export async function GET() {
  try {
    const user = await getAuthUser()

    if (!user || !user.schoolId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

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

    if (!school || !school.subscription) {
      return NextResponse.json({ error: 'Aucun abonnement trouvé' }, { status: 404 })
    }

    const planName = school.subscription.plan.name as any
    const planConfig = PLAN_CONFIGS[planName]

    return NextResponse.json({
      planName: planConfig.name,
      limits: planConfig.limits,
      trialEndsAt: school.subscription.trialEndsAt,
      currentPeriodEnd: school.subscription.currentPeriodEnd,
      status: school.subscription.status
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
'@

New-Item -ItemType Directory -Path "d:\react\UE-GI app\schooly\app\api\subscription" -Force | Out-Null
Set-Content -Path "d:\react\UE-GI app\schooly\app\api\subscription\current\route.ts" -Value $apiContent
Write-Host "✅ app/api/subscription/current/route.ts créé" -ForegroundColor Green

Write-Host "`n✨ Composants et middleware créés avec succès!" -ForegroundColor Green
Write-Host "📦 Fichiers créés:" -ForegroundColor Cyan
Write-Host "  - lib/subscription/useSubscription.ts" -ForegroundColor White
Write-Host "  - lib/subscription/middleware.ts" -ForegroundColor White
Write-Host "  - components/subscription/FeatureGate.tsx" -ForegroundColor White
Write-Host "  - components/subscription/LimitWarning.tsx" -ForegroundColor White
Write-Host "  - app/api/subscription/current/route.ts" -ForegroundColor White
Write-Host "`n⏭️  Exécutez le script suivant pour créer la page de pricing:" -ForegroundColor Yellow
Write-Host "  .\scripts\create-pricing-page.ps1" -ForegroundColor White
