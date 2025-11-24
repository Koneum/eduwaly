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
  onSelectPlan?: (planId: string, planName: string) => void
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

export function PricingSection({ onSelectPlan, currentPlan }: PricingSectionProps) {
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
    <section className="w-full py-6 sm:py-8">
      <div className="container px-4 md:px-6 max-w-7xl mx-auto">
        {/* Header - Style Freepik */}
        <div className="text-center mb-8 sm:mb-12 space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Choisissez votre plan
          </h1>
        </div>

        {/* Plans Grid - Style Freepik */}
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-12 justify-items-center max-w-5xl mx-auto">
          {plans.filter(p => p.name !== 'ENTERPRISE').map((plan) => {
            const features = parseFeatures(plan.features)
            const priceDisplay = `${Number(plan.price).toLocaleString()}`
            const isPopular = plan.isPopular
            const isCurrent = currentPlan === plan.name
            
            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col p-5 sm:p-6 transition-all w-full max-w-sm rounded-xl ${
                  isCurrent
                    ? "border-2 border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/20"
                    : isPopular
                    ? "border-2 border-blue-500 bg-linear-to-b from-blue-500/5 to-transparent shadow-lg shadow-blue-500/20"
                    : "border border-border bg-card"
                }`}
              >
                {/* Badges */}
                {isPopular && !isCurrent && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-4 py-1 text-[11px] font-semibold rounded-full">
                      Offre recommandée
                    </Badge>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white px-4 py-1 text-[11px] font-semibold rounded-full flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Plan actuel
                    </Badge>
                  </div>
                )}

                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-3">{plan.displayName}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description || ''}</p>
                  
                  {/* Prix */}
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-bold">{priceDisplay}</span>
                    <span className="text-sm text-muted-foreground">FCFA</span>
                    <span className="text-sm text-muted-foreground">/{plan.interval === 'MONTHLY' ? 'mois' : 'an'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Facturé {plan.interval === 'MONTHLY' ? 'mensuellement' : 'annuellement'}</p>
                </div>

                {/* Features */}
                <div className="space-y-3 flex-1 mb-5">
                  <p className="text-sm font-semibold">Tout ce qui est inclus dans {plan.name === 'STARTER' ? 'le plan d\'essai' : plans.find(p => p.name === 'STARTER')?.displayName || 'le plan précédent'}, et :</p>
                  <ul className="space-y-2.5">
                    {features.slice(0, 6).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Button placé en bas des spécifications */}
                <Button
                  onClick={() => onSelectPlan?.(plan.id, plan.name)}
                  disabled={isCurrent}
                  className={`w-full mt-auto ${
                    isCurrent
                      ? "bg-muted text-muted-foreground cursor-pointer"
                      : isPopular
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-white text-slate-900 hover:bg-primary border border-primary"
                  }`}
                >
                  {isCurrent ? "Plan actuel" : (isPopular ? "Mettre à niveau" : "Choisir ce plan")}
                </Button>

                {/* Stock content note */}
                {plan.name === 'STARTER' && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-semibold mb-2">Contenu stock :</p>
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="text-red-500">×</span>
                      <span>Ce plan n&apos;inclut pas le contenu stock Premium</span>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        {/* Enterprise Plan - Style Freepik */}
        {plans.find(p => p.name === 'ENTERPRISE') && (
          <Card className="p-6 sm:p-8 mb-12 bg-linear-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white border-slate-700">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-white/10 rounded">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold">Enterprise</h3>
                </div>
                <p className="text-sm text-slate-300 mb-4">
                  AI-powered creativity at scale—unlimited users, advanced controls, and full support
                </p>
                <Button
                  onClick={() => onSelectPlan?.('enterprise', 'ENTERPRISE')}
                  variant="outline"
                  className="bg-white text-slate-900 hover:bg-slate-100 border-0"
                >
                  Learn more
                </Button>
              </div>
              
              <div className="lg:col-span-2">
                <p className="text-sm font-semibold mb-3">Access to all AI models for video and image creation, Premium stock content, and merchandising license, plus:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                      <span>Unlimited access to leading AI models through Freepik</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                      <span>Rights over your AI-generated content</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                      <span>Legal indemnification for AI-generated content</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                      <span>Expert guidance, training, and technical support</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                      <span>Unlimited users, flexible credits</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                      <span>Freepik Studios: custom, high-impact AI content</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                      <span>Enterprise-grade security and compliance</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                      <span>Single Sign-On (SSO) for secure and simplified access</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                      <span>Centralized admin control</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Tableau comparatif - Style Freepik */}
        {plans.length > 0 && (
          <div className="mt-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-2">Compare plans</h2>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-sm w-1/4"></th>
                    {plans.map((plan) => {
                      const isCurrent = currentPlan === plan.name
                      const isPopular = plan.isPopular
                      return (
                        <th 
                          key={plan.id} 
                          className={`text-center p-4 min-w-[140px] ${
                            isPopular ? 'bg-blue-500/5' : ''
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="font-bold text-base">{plan.displayName}</div>
                            {plan.name !== 'ENTERPRISE' && (
                              <>
                                <div className="text-sm text-muted-foreground">
                                  {Number(plan.price).toLocaleString()} FCFA/{plan.interval === 'MONTHLY' ? 'mois' : 'an'}
                                </div>
                                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                  <Check className="h-3 w-3" />
                                  <span>{plan.maxStudents} étudiants/mois</span>
                                </div>
                              </>
                            )}
                            {isCurrent && (
                              <Badge className="bg-green-500 text-white text-xs">
                                <Check className="h-3 w-3 mr-1" />
                                Your current plan
                              </Badge>
                            )}
                            {!isCurrent && (
                              <Button
                                onClick={() => onSelectPlan?.(plan.id, plan.name)}
                                size="sm"
                                className={isPopular ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
                              >
                                {plan.name === 'ENTERPRISE' ? 'Learn more' : (isPopular ? 'Upgrade' : 'Downgrade')}
                              </Button>
                            )}
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
              <tbody>

                {/* Lignes de comparaison par catégorie - Style Freepik */}
                {Object.entries(
                  comparisonRows.reduce((acc, row) => {
                    if (!acc[row.category]) acc[row.category] = []
                    acc[row.category].push(row)
                    return acc
                  }, {} as Record<string, ComparisonRow[]>)
                ).map(([category, categoryRows]) => (
                  <React.Fragment key={category}>
                    <tr className="border-b border-border bg-muted/20">
                      <td className="p-4 font-semibold text-sm" colSpan={plans.length + 1}>
                        {category}
                      </td>
                    </tr>
                    {categoryRows.map((row) => (
                      <tr key={row.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="p-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span>{row.label}</span>
                          </div>
                        </td>
                        {plans.map((plan) => {
                          const value = row.values.find(v => v.planId === plan.id)?.value || ''
                          const isCheck = value === '✅' || value.toLowerCase() === 'oui'
                          const isCross = value === '❌' || value.toLowerCase() === 'non'
                          const isPopular = plan.isPopular
                          
                          return (
                            <td 
                              key={plan.id} 
                              className={`text-center p-4 text-sm ${
                                isPopular ? 'bg-blue-500/5' : ''
                              }`}
                            >
                              {isCheck ? (
                                <Check className="h-4 w-4 text-green-500 mx-auto" />
                              ) : isCross ? (
                                <span className="text-muted-foreground">×</span>
                              ) : (
                                <span className="text-sm">{value}</span>
                              )}
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
