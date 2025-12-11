'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, Zap, Crown, ArrowRight, Loader2 } from "lucide-react"
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Plan {
  id: string
  name: string
  displayName: string
  price: number
  interval: string
  description: string | null
  features: string
  maxStudents: number
  maxTeachers: number
  isPopular: boolean
}

interface UpgradeManagerProps {
  plans: Plan[]
  currentPlan: string
  schoolId: string
}

// Helper pour parser les features
function parseFeatures(features: string): string[] {
  try {
    const parsed = JSON.parse(features)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return features.split('\n').filter(f => f.trim())
  }
}

export function UpgradeManager({ plans, currentPlan, schoolId }: UpgradeManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const formatPrice = (price: number, interval: string) => {
    if (price === 0) return 'Gratuit'
    return `${price.toLocaleString()} FCFA/${interval === 'MONTHLY' ? 'mois' : 'an'}`
  }

  const getPlanIcon = (name: string) => {
    switch (name.toUpperCase()) {
      case 'STARTER':
        return <Sparkles className="h-5 w-5" />
      case 'PROFESSIONAL':
        return <Zap className="h-5 w-5" />
      case 'BUSINESS':
      case 'ENTERPRISE':
        return <Crown className="h-5 w-5" />
      default:
        return <Sparkles className="h-5 w-5" />
    }
  }

  const isCurrentPlan = (planName: string) => {
    return planName.toUpperCase() === currentPlan.toUpperCase()
  }

  const canUpgrade = (planName: string) => {
    const planOrder = ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE']
    const currentIndex = planOrder.indexOf(currentPlan.toUpperCase())
    const targetIndex = planOrder.indexOf(planName.toUpperCase())
    return targetIndex > currentIndex
  }

  const canDowngrade = (planName: string) => {
    const planOrder = ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE']
    const currentIndex = planOrder.indexOf(currentPlan.toUpperCase())
    const targetIndex = planOrder.indexOf(planName.toUpperCase())
    return targetIndex < currentIndex
  }

  const handleUpgrade = async (planId: string, planName: string) => {
    if (isCurrentPlan(planName)) {
      toast.info('Vous êtes déjà sur ce plan')
      return
    }

    setLoading(planId)

    try {
      const response = await fetch('/api/school-admin/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          planId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à niveau')
      }

      toast.success('Plan mis à niveau avec succès!')
      router.refresh()
      router.push(`/admin/${schoolId}`)

    } catch (error) {
      console.error('Erreur upgrade:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à niveau')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Comparaison des plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = isCurrentPlan(plan.name)
          const canUpgradeToPlan = canUpgrade(plan.name)

          return (
            <Card 
              key={plan.id}
              className={`relative ${plan.isPopular ? 'border-primary border-2 shadow-lg' : ''} ${isCurrent ? 'bg-accent/50' : ''}`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    ⭐ Recommandé
                  </Badge>
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="secondary" className="px-4 py-1">
                    Plan Actuel
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  {getPlanIcon(plan.name)}
                  <CardTitle className="text-2xl">{plan.displayName}</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Prix */}
                <div>
                  <div className="text-4xl font-bold text-primary">
                    {plan.price === 0 ? 'Gratuit' : `${plan.price.toLocaleString()}`}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {plan.price === 0 ? '30 jours d\'essai' : `FCFA / ${plan.interval === 'MONTHLY' ? 'mois' : 'an'}`}
                  </div>
                </div>

                {/* Limites */}
                <div className="space-y-2 pb-4 border-b">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Étudiants</span>
                    <span className="font-semibold">
                      {plan.maxStudents === -1 ? 'Illimité' : plan.maxStudents}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Enseignants</span>
                    <span className="font-semibold">
                      {plan.maxTeachers === -1 ? 'Illimité' : plan.maxTeachers}
                    </span>
                  </div>
                </div>

                {/* Fonctionnalités */}
                <div className="space-y-3">
                  <div className="text-sm font-semibold">Fonctionnalités incluses:</div>
                  <ul className="space-y-2">
                    {parseFeatures(plan.features).slice(0, 6).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {parseFeatures(plan.features).length > 6 && (
                      <li className="text-xs text-muted-foreground pl-6">
                        +{parseFeatures(plan.features).length - 6} autres fonctionnalités...
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>

              <CardFooter>
                {isCurrent ? (
                  <Button disabled className="w-full" variant="secondary">
                    <Check className="mr-2 h-4 w-4" />
                    Plan Actuel
                  </Button>
                ) : canUpgradeToPlan ? (
                  <Button 
                    onClick={() => handleUpgrade(plan.id, plan.name)}
                    disabled={loading !== null}
                    className="w-full"
                  >
                    {loading === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mise à niveau...
                      </>
                    ) : (
                      <>
                        Choisir ce plan
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : canDowngrade(plan.name) ? (
                  <Button 
                    onClick={() => handleUpgrade(plan.id, plan.name)}
                    disabled={loading !== null}
                    className="w-full"
                    variant="outline"
                  >
                    {loading === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Changement...
                      </>
                    ) : (
                      <>
                        Rétrograder vers ce plan
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button disabled className="w-full" variant="outline">
                    Non disponible
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Informations supplémentaires */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Informations Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <p>
              <strong>Mise à niveau immédiate:</strong> Votre nouveau plan est activé instantanément
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <p>
              <strong>Données conservées:</strong> Toutes vos données sont préservées lors du changement
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <p>
              <strong>Support inclus:</strong> Assistance technique disponible pour tous les plans
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <p>
              <strong>Facturation:</strong> Le montant est calculé au prorata de la période restante
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Des questions sur les plans? Contactez notre équipe commerciale à{' '}
          <a href="mailto:sales@schooly.com" className="text-primary hover:underline">
            sales@schooly.com
          </a>
        </p>
      </div>
    </div>
  )
}
