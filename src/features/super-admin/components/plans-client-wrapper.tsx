'use client'

import { useState } from 'react'
import PlansManager from "@/components/super-admin/plans-manager"
import ComparisonTableManager from "@/components/super-admin/comparison-table-manager"

interface Plan {
  id: string
  name: string
  displayName: string
  price: number
  interval: string
  description: string | null
  features: string | string[] | null
  modulesIncluded: string | string[] | null
  maxStudents: number
  maxTeachers: number
  isActive: boolean
  isPopular: boolean
}

interface SimplePlan {
  id: string
  name: string
  displayName: string
  price: number
  interval: string
}

interface PlansClientWrapperProps {
  initialPlans: Plan[]
  simplePlans: SimplePlan[]
  activeTab: 'plans' | 'comparison'
}

export default function PlansClientWrapper({ initialPlans, simplePlans, activeTab }: PlansClientWrapperProps) {
  const [plans, setPlans] = useState(initialPlans)
  const [simplePlansState, setSimplePlansState] = useState(simplePlans)

  // Fonction pour recharger les plans
  const handlePlansUpdate = async () => {
    try {
      const response = await fetch('/api/super-admin/plans')
      if (response.ok) {
        const data = await response.json()
        const updatedPlans = data.plans
        setPlans(updatedPlans)
        
        // Mettre à jour aussi les simple plans pour le tableau comparatif
        const updatedSimplePlans = updatedPlans.map((p: Plan) => ({
          id: p.id,
          name: p.name,
          displayName: p.displayName,
          price: p.price,
          interval: p.interval
        }))
        setSimplePlansState(updatedSimplePlans)
      }
    } catch (error) {
      console.error('Erreur rechargement plans:', error)
    }
  }

  if (activeTab === 'plans') {
    return <PlansManager initialPlans={plans} />
  } else {
    return <ComparisonTableManager plans={simplePlansState} onPlansUpdate={handlePlansUpdate} />
  }
}
