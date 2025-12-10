'use client'

import { AlertCircle, Sparkles, ArrowRight } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface PlanUpgradeBannerProps {
  feature: string
  currentPlan: string
  requiredPlan?: string
  className?: string
}

export function PlanUpgradeBanner({ 
  feature, 
  currentPlan, 
  requiredPlan = "Premium",
  className 
}: PlanUpgradeBannerProps) {
  const router = useRouter()

  return (
    <Alert className={`border-amber-500 bg-amber-50 dark:bg-amber-950/30 ${className}`}>
      <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-900 dark:text-amber-100 font-semibold">
        Fonctionnalité Premium
      </AlertTitle>
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        <p className="mb-3">
          <strong>{feature}</strong> nécessite le plan <strong>{requiredPlan}</strong>.
        </p>
        <p className="text-sm mb-4">
          Votre plan actuel: <span className="font-medium">{currentPlan}</span>
        </p>
        <Button 
          onClick={() => router.push('/admin/subscription/upgrade')}
          className="bg-amber-600 hover:bg-amber-700 text-white"
          size="sm"
        >
          Mettre à niveau
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  )
}

interface LimitReachedBannerProps {
  limitType: string
  currentValue: number
  maxValue: number
  className?: string
}

export function LimitReachedBanner({ 
  limitType, 
  currentValue, 
  maxValue,
  className 
}: LimitReachedBannerProps) {
  const router = useRouter()

  return (
    <Alert className={`border-red-500 bg-red-50 dark:bg-red-950/30 ${className}`}>
      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
      <AlertTitle className="text-red-900 dark:text-red-100 font-semibold">
        Limite Atteinte
      </AlertTitle>
      <AlertDescription className="text-red-800 dark:text-red-200">
        <p className="mb-3">
          Vous avez atteint la limite de <strong>{limitType}</strong> pour votre plan.
        </p>
        <p className="text-sm mb-4">
          Actuel: <span className="font-medium">{currentValue}</span> / Maximum: <span className="font-medium">{maxValue}</span>
        </p>
        <Button 
          onClick={() => router.push('/admin/subscription/upgrade')}
          className="bg-red-600 hover:bg-red-700 text-white"
          size="sm"
        >
          Augmenter la limite
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  )
}
