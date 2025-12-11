'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, Zap, Crown, ArrowRight, Loader2, Users, GraduationCap } from "lucide-react"
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from "@/lib/utils"

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

      // Rediriger vers la page de checkout pour le paiement
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        toast.success('Plan mis à niveau avec succès!')
        router.refresh()
        router.push(`/admin/${schoolId}`)
      }

    } catch (error) {
      console.error('Erreur upgrade:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à niveau')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Comparaison des plans - Design amélioré */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const isCurrent = isCurrentPlan(plan.name)
          const canUpgradeToPlan = canUpgrade(plan.name)
          const features = parseFeatures(plan.features)

          return (
            <Card 
              key={plan.id}
              className={cn(
                "relative flex flex-col transition-all duration-200 hover:shadow-xl",
                plan.isPopular && "ring-2 ring-primary shadow-lg scale-[1.02]",
                isCurrent && "bg-primary/5 border-primary/30"
              )}
            >
              {/* Badges en haut */}
              <div className="absolute -top-3 left-0 right-0 flex justify-center gap-2">
                {plan.isPopular && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md">
                    ⭐ Populaire
                  </Badge>
                )}
                {isCurrent && (
                  <Badge variant="secondary" className="bg-primary text-primary-foreground shadow-md">
                    Votre plan
                  </Badge>
                )}
              </div>

              <CardHeader className="pt-8 pb-4 text-center">
                {/* Icône */}
                <div className={cn(
                  "mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4",
                  isCurrent ? "bg-primary/20" : "bg-muted"
                )}>
                  {getPlanIcon(plan.name)}
                </div>
                
                <CardTitle className="text-xl font-bold">{plan.displayName}</CardTitle>
                <CardDescription className="text-xs min-h-[40px]">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                {/* Prix - Design compact */}
                <div className="text-center py-4 rounded-xl bg-muted/50">
                  <div className="text-3xl font-bold text-primary">
                    {plan.price === 0 ? 'Gratuit' : `${plan.price.toLocaleString()}`}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {plan.price === 0 ? '30 jours d\'essai' : `FCFA/${plan.interval === 'MONTHLY' ? 'mois' : 'an'}`}
                  </div>
                </div>

                {/* Limites - Design compact avec icônes */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                    <GraduationCap className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                    <div className="text-sm font-bold">
                      {plan.maxStudents === -1 ? '∞' : plan.maxStudents}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Étudiants</div>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                    <Users className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
                    <div className="text-sm font-bold">
                      {plan.maxTeachers === -1 ? '∞' : plan.maxTeachers}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Enseignants</div>
                  </div>
                </div>

                {/* Fonctionnalités - Liste compacte */}
                <div className="space-y-2">
                  {features.slice(0, 5).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                  {features.length > 5 && (
                    <div className="text-[10px] text-muted-foreground pl-5">
                      +{features.length - 5} autres...
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-4">
                {isCurrent ? (
                  <Button disabled className="w-full h-11" variant="secondary">
                    <Check className="mr-2 h-4 w-4" />
                    Plan actuel
                  </Button>
                ) : canUpgradeToPlan ? (
                  <Button 
                    onClick={() => handleUpgrade(plan.id, plan.name)}
                    disabled={loading !== null}
                    className="w-full h-11 bg-gradient-to-r from-primary to-primary/80"
                  >
                    {loading === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      <>
                        Passer à ce plan
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : canDowngrade(plan.name) ? (
                  <Button 
                    onClick={() => handleUpgrade(plan.id, plan.name)}
                    disabled={loading !== null}
                    className="w-full h-11"
                    variant="outline"
                  >
                    {loading === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      'Rétrograder'
                    )}
                  </Button>
                ) : (
                  <Button disabled className="w-full h-11" variant="ghost">
                    Contactez-nous
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
