"use client"

import React, { useState, useEffect } from "react"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

// Helper pour parser les features
function parseFeatures(features: string): string[] {
  try {
    const parsed = JSON.parse(features)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return features.split('\n').filter(f => f.trim())
  }
}

interface PricingSectionProps {
  onSelectPlan?: (planName: string) => void
  showTrialInfo?: boolean
  currentPlan?: string
}

interface ComparisonRow {
  id: string
  category: string
  label: string
  order: number
  values: Array<{
    planId: string
    value: string
  }>
}

export function PricingSection({ onSelectPlan, showTrialInfo = true, currentPlan }: PricingSectionProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [comparisonRows, setComparisonRows] = useState<ComparisonRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger les plans
        const plansResponse = await fetch('/api/plans')
        if (plansResponse.ok) {
          const plansData = await plansResponse.json()
          setPlans(plansData.plans)
        }

        // Charger les lignes de comparaison
        const rowsResponse = await fetch('/api/super-admin/comparison-rows')
        if (rowsResponse.ok) {
          const rowsData = await rowsResponse.json()
          setComparisonRows(rowsData.rows)
        }
      } catch (error) {
        console.error('Erreur chargement données:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <section className="w-full py-8 sm:py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Chargement des plans...</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full py-8 sm:py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center mb-8 sm:mb-12">
          <div className="space-y-2">
            <h1 className="text-responsive-2xl font-bold tracking-tight text-balance">
              Plans et Tarifs
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground text-responsive-base text-balance">
              Choisissez le plan adapté à votre établissement. Commencez avec 30 jours gratuits.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const features = parseFeatures(plan.features)
            const priceDisplay = plan.maxStudents === -1 ? "Sur devis" : `${Number(plan.price).toLocaleString()}`
            const isEnterprise = plan.maxStudents === -1
            
            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col p-4 sm:p-6 transition-all hover:shadow-lg ${
                  plan.isPopular
                    ? "border-primary shadow-lg shadow-primary/20 lg:scale-105"
                    : "border-border"
                }`}
              >
                {plan.isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Recommandé
                  </Badge>
                )}

                <div className="mb-4 sm:mb-6">
                  <h3 className="text-responsive-lg font-semibold mb-2">{plan.displayName}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    {!isEnterprise ? (
                      <>
                        <span className="text-responsive-2xl font-bold">{priceDisplay}</span>
                        <span className="text-responsive-xs text-muted-foreground">FCFA</span>
                        <span className="text-responsive-sm text-muted-foreground">/{plan.interval === 'MONTHLY' ? 'mois' : 'an'}</span>
                      </>
                    ) : (
                      <span className="text-responsive-xl font-bold">{priceDisplay}</span>
                    )}
                  </div>
                  <p className="text-responsive-sm text-muted-foreground">{plan.description || ''}</p>
                </div>

                <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 flex-1">
                  {features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-responsive-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => onSelectPlan?.(plan.name)}
                  disabled={currentPlan === plan.name}
                  className={`w-full text-responsive-sm ${
                    plan.isPopular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {currentPlan === plan.name ? "Plan actuel" : (isEnterprise ? "Nous contacter" : "Essayer 30 jours gratuits")}
                </Button>
              </Card>
            )
          })}
        </div>

        {showTrialInfo && (
          <div className="mt-8 sm:mt-12 text-center space-y-2">
            <p className="text-responsive-sm text-muted-foreground">
              🎉 <strong>Offre de lancement BETA</strong> : 30 jours gratuits pour tous les nouveaux inscrits
            </p>
            <p className="text-responsive-xs text-muted-foreground">
              Aucune carte bancaire requise. Annulez à tout moment.
            </p>
          </div>
        )}

        {/* Tableau comparatif dynamique */}
        {plans.length > 0 && (
          <div className="mt-12 sm:mt-20">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-responsive-xl font-bold mb-3 sm:mb-4">Comparez les fonctionnalités</h2>
              <p className="text-muted-foreground text-responsive-base">
                Tableau détaillé de toutes les fonctionnalités par plan
              </p>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-lg border border-border">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b-2 border-border bg-muted/50">
                    <th className="text-left p-3 sm:p-4 font-semibold text-responsive-sm sticky left-0 bg-muted/50 z-10">Fonctionnalité</th>
                    {plans.map((plan) => (
                      <th 
                        key={plan.id} 
                        className={`text-center p-3 sm:p-4 font-semibold text-responsive-xs min-w-[120px] ${
                          plan.isPopular ? 'bg-primary/5' : ''
                        }`}
                      >
                        {plan.displayName}
                      </th>
                    ))}
                  </tr>
                </thead>
              <tbody>
                {/* Prix */}
                <tr className="border-b border-border bg-muted/30">
                  <td className="p-3 sm:p-4 font-semibold text-responsive-sm sticky left-0 bg-muted/30 z-10" colSpan={plans.length + 1}>Tarifs & Limites</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="p-3 sm:p-4 text-responsive-xs sticky left-0 bg-background">Prix (FCFA/{plans[0]?.interval === 'MONTHLY' ? 'mois' : 'an'})</td>
                  {plans.map((plan) => (
                    <td 
                      key={plan.id} 
                      className={`text-center p-3 sm:p-4 text-responsive-xs font-semibold ${
                        plan.isPopular ? 'bg-primary/5' : ''
                      }`}
                    >
                      {plan.maxStudents === -1 ? 'Sur devis' : Number(plan.price).toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="p-3 sm:p-4 text-responsive-xs sticky left-0 bg-background">Étudiants max</td>
                  {plans.map((plan) => (
                    <td 
                      key={plan.id} 
                      className={`text-center p-3 sm:p-4 text-responsive-xs ${
                        plan.isPopular ? 'bg-primary/5' : ''
                      }`}
                    >
                      {plan.maxStudents === -1 ? '∞' : plan.maxStudents}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="p-3 sm:p-4 text-responsive-xs sticky left-0 bg-background">Enseignants max</td>
                  {plans.map((plan) => (
                    <td 
                      key={plan.id} 
                      className={`text-center p-3 sm:p-4 text-responsive-xs ${
                        plan.isPopular ? 'bg-primary/5' : ''
                      }`}
                    >
                      {plan.maxTeachers === -1 ? '∞' : plan.maxTeachers}
                    </td>
                  ))}
                </tr>

                {/* Lignes de comparaison dynamiques par catégorie */}
                {Object.entries(
                  comparisonRows.reduce((acc, row) => {
                    if (!acc[row.category]) acc[row.category] = []
                    acc[row.category].push(row)
                    return acc
                  }, {} as Record<string, ComparisonRow[]>)
                ).map(([category, categoryRows]) => (
                  <React.Fragment key={category}>
                    <tr className="border-b border-border bg-muted/30">
                      <td className="p-3 sm:p-4 font-semibold text-responsive-sm sticky left-0 bg-muted/30 z-10" colSpan={plans.length + 1}>
                        {category}
                      </td>
                    </tr>
                    {categoryRows.map((row) => (
                      <tr key={row.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="p-3 sm:p-4 text-responsive-xs sticky left-0 bg-background">{row.label}</td>
                        {plans.map((plan) => {
                          const value = row.values.find(v => v.planId === plan.id)?.value || '❌'
                          return (
                            <td 
                              key={plan.id} 
                              className={`text-center p-3 sm:p-4 text-responsive-xs ${
                                plan.isPopular ? 'bg-primary/5' : ''
                              }`}
                            >
                              {value}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </section>
  )
}
