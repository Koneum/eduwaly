"use client"

import { useState, useEffect } from "react"
import { PricingSection } from "@/components/pricing/PricingSection"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CreditCard, Calendar, CheckCircle2 } from "lucide-react"

interface PlanSelectorProps {
  schoolId: string
  currentPlan?: string
}

export function PlanSelector({ currentPlan: initialPlan }: PlanSelectorProps) {
  const router = useRouter()
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

  const handleSelectPlan = async (planName: string) => {
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
      const response = await fetch('/api/school-admin/subscription/upgrade', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour")
      }

      // Si paiement nécessaire, rediriger vers VitePay
      if (data.paymentUrl) {
        toast.success("Redirection vers la page de paiement...", {
          description: `Montant: ${data.amount.toLocaleString('fr-FR')} FCFA`,
        })
        
        // Rediriger vers VitePay
        setTimeout(() => {
          window.location.href = data.paymentUrl
        }, 1500)
      } else {
        toast.success("Plan mis à jour avec succès!")
        router.refresh()
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
