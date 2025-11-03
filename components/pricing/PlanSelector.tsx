"use client"

import { useState } from "react"
import { PricingSection } from "@/components/pricing/PricingSection"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface PlanSelectorProps {
  schoolId: string
  currentPlan?: string
}

export function PlanSelector({ schoolId, currentPlan }: PlanSelectorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSelectPlan = async (planName: string) => {
    if (planName === currentPlan) {
      toast.info("Vous êtes déjà sur ce plan")
      return
    }

    if (planName === "ENTERPRISE") {
      toast.info("Contactez-nous pour un devis personnalisé")
      // TODO: Ouvrir un formulaire de contact
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/school-admin/subscription`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName }),
      })

      if (response.ok) {
        toast.success("Plan mis à jour avec succès!")
        router.refresh()
      } else {
        const data = await response.json()
        toast.error(data.error || "Erreur lors de la mise à jour")
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du plan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PricingSection onSelectPlan={handleSelectPlan} showTrialInfo={false} />
    </div>
  )
}
