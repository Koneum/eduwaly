"use client"

import { useState, useEffect } from "react"
import { PricingSection } from "@/components/pricing/PricingSection"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CreditCard, Calendar, CheckCircle2 } from "lucide-react"

interface Plan {
  id: string
  name: string
  displayName: string
  description: string | null
  price: number
  interval: string
  maxStudents: number
  maxTeachers: number
  features: string
  isPopular: boolean
  isActive: boolean
}

interface PlanSelectorProps {
  schoolId: string
  currentPlan?: string
}

export function PlanSelector({ currentPlan: initialPlan, schoolId }: PlanSelectorProps) {
  const [loading, setLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState(initialPlan || 'STARTER')
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    status: string
    currentPeriodEnd?: Date
  } | null>(null)

  useEffect(() => {
    // Charger les infos de l'abonnement
    const fetchSubscriptionInfo = async () => {
      try {
        const response = await fetch('/api/school-admin/subscription/upgrade')
        if (response.ok) {
          const data = await response.json()
          setCurrentPlan(data.currentPlan)
          setSubscriptionInfo({
            status: data.status,
            currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : undefined,
          })
        }
      } catch (error) {
        console.error('Erreur chargement subscription:', error)
      }
    }

    fetchSubscriptionInfo()
  }, [])

  const handleSelectPlan = async (planId: string, planName: string) => {
    // Vérifier si déjà sur ce plan
    if (planName === currentPlan) {
      toast.info("Vous êtes déjà sur ce plan")
      return
    }

    // Enterprise nécessite contact
    if (planName === "ENTERPRISE") {
      toast.info("Contactez-nous pour un devis personnalisé", {
        description: "Envoyez un email à contact@schooly.app",
      })
      return
    }

    setLoading(true)
    try {
      // Récupérer les plans pour trouver l'ID correspondant au nom
      const plansResponse = await fetch('/api/plans')
      if (!plansResponse.ok) {
        throw new Error("Erreur lors de la récupération des plans")
      }
      const plansData = await plansResponse.json()
      
      // Trouver le plan par nom
      const plan = plansData.plans.find((p: Plan) => p.name === planName)
      if (!plan) {
        throw new Error("Plan non trouvé")
      }

      // Créer le paiement VitePay directement avec le vrai ID
      const paymentResponse = await fetch('/api/vitepay/create-payment', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id, // Utiliser l'ID réel du plan
          schoolId: schoolId
          // paymentMethod n'est pas nécessaire pour l'API VitePay
        }),
      })

      console.log('📡 Réponse API paiement:', {
        status: paymentResponse.status,
        statusText: paymentResponse.statusText
      })

      const paymentData = await paymentResponse.json()
      console.log('📦 Données reçues de l\'API:', paymentData)

      if (!paymentData.success) {
        console.error('❌ Erreur API paiement:', {
          status: paymentResponse.status,
          error: paymentData.error,
          details: paymentData.details
        })
        throw new Error(paymentData.error || "Erreur lors de la création du paiement")
      }

      // Rediriger directement vers VitePay
      if (paymentData.redirectUrl) {
        console.log('Redirection vers VitePay:', paymentData.redirectUrl)
        toast.success("Redirection vers VitePay...", {
          description: `Montant: ${paymentData.amount?.toLocaleString('fr-FR') || '...'} FCFA`,
        })
        
        setTimeout(() => {
          window.location.href = paymentData.redirectUrl
        }, 1500)
      } else {
        throw new Error("URL de paiement non reçue")
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour du plan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Info abonnement actuel - Version compacte */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-responsive-base sm:text-responsive-lg font-bold">{currentPlan}</p>
                <p className="text-responsive-xs text-muted-foreground">Plan actuel</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              {subscriptionInfo?.currentPeriodEnd && (
                <div className="flex items-center gap-1.5 text-responsive-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {subscriptionInfo.currentPeriodEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                </div>
              )}
              <Badge 
                variant={subscriptionInfo?.status === 'ACTIVE' ? 'default' : 'secondary'}
                className="text-[10px] sm:text-responsive-xs h-5 sm:h-6"
              >
                {subscriptionInfo?.status === 'ACTIVE' ? (
                  <>
                    <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                    Actif
                  </>
                ) : (
                  subscriptionInfo?.status || 'Inactif'
                )}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overlay de chargement */}
      {loading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="p-4 sm:p-6 max-w-sm w-full">
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
              <p className="text-responsive-sm text-muted-foreground text-center">
                Traitement en cours...
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Section pricing */}
      <PricingSection 
        onSelectPlan={handleSelectPlan} 
        currentPlan={currentPlan}
      />
    </div>
  )
}
