"use client"

import React, { useState, useEffect } from "react"
import { Check, Loader2, Mail } from "lucide-react"
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
  schoolType?: string | null
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

interface SchoolInfo {
  name?: string
  email?: string
  adminName?: string
  adminEmail?: string
}

interface PricingSectionProps {
  onSelectPlan?: (planId: string, planName: string) => void
  currentPlan?: string
  schoolType?: 'UNIVERSITY' | 'HIGH_SCHOOL'
  schoolInfo?: SchoolInfo
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

export function PricingSection({ onSelectPlan, currentPlan, schoolType, schoolInfo }: PricingSectionProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [comparisonRows, setComparisonRows] = useState<ComparisonRow[]>([])
  const [loading, setLoading] = useState(true)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  // Type effectif (fallback sur UNIVERSITY si non défini)
  const effectiveType = schoolType || 'UNIVERSITY'

  // Calcul du prix annuel avec 5% de réduction
  const getAnnualPrice = (monthlyPrice: number) => {
    if (monthlyPrice === 0) return 0
    const yearlyTotal = monthlyPrice * 12
    const discount = yearlyTotal * 0.05
    return Math.round(yearlyTotal - discount)
  }

  const getDisplayPrice = (price: number) => {
    if (price === 0) return '0'
    if (billingPeriod === 'yearly') {
      return getAnnualPrice(price).toLocaleString()
    }
    return price.toLocaleString()
  }

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

  // Filtrer les plans selon le type de structure (avec fallback si aucun plan ne correspond)
  const filteredPlans = plans.filter(p => p.schoolType === effectiveType).length > 0
    ? plans.filter(p => p.schoolType === effectiveType)
    : plans.filter(p => p.isActive)
  
  // Filtrer les lignes de comparaison selon le type
  const filteredComparisonRows = comparisonRows.filter(row => {
    const typeName = effectiveType === 'UNIVERSITY' ? 'Université' : 'Lycée'
    return row.category.includes(typeName)
  })

  // Générer l'URL mailto pour contacter le support
  const handleContactSupport = () => {
    const typeLabel = effectiveType === 'UNIVERSITY' ? 'Université' : 'Lycée'
    const subject = encodeURIComponent(`Demande de devis - Plan Sur Mesure ${typeLabel}`)
    const body = encodeURIComponent(
      `Bonjour,\n\n` +
      `Je souhaite obtenir un devis pour un plan Sur Mesure.\n\n` +
      `--- Informations ---\n` +
      `Établissement: ${schoolInfo?.name || 'Non renseigné'}\n` +
      `Type: ${typeLabel}\n` +
      `Email établissement: ${schoolInfo?.email || 'Non renseigné'}\n` +
      `Administrateur: ${schoolInfo?.adminName || 'Non renseigné'}\n` +
      `Email administrateur: ${schoolInfo?.adminEmail || 'Non renseigné'}\n\n` +
      `Cordialement`
    )
    window.location.href = `mailto:support@educwaly.com?subject=${subject}&body=${body}`
  }

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
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Choisissez votre plan
          </h1>
          <p className="text-muted-foreground">
            Plans pour {effectiveType === 'UNIVERSITY' ? 'Université' : 'Lycée'}
          </p>
          
          {/* Sélecteur Mensuel / Annuel */}
          <div className="flex justify-center pt-2">
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted">
              <Button
                variant={billingPeriod === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingPeriod('monthly')}
                className="rounded-lg"
              >
                Mensuel
              </Button>
              <Button
                variant={billingPeriod === 'yearly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingPeriod('yearly')}
                className="rounded-lg relative"
              >
                Annuel
                <Badge className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] px-1.5 py-0">
                  -5%
                </Badge>
              </Button>
            </div>
          </div>
        </div>

        {/* Plans Grid - Filtré automatiquement selon le type */}
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-12 justify-items-center max-w-5xl mx-auto">
          {filteredPlans.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              Aucun plan disponible. Veuillez réessayer plus tard.
            </div>
          )}
          {filteredPlans.filter(p => !p.name.toLowerCase().includes('custom')).map((plan) => {
            const features = parseFeatures(plan.features)
            const priceDisplay = getDisplayPrice(plan.price)
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
                    <span className="text-sm text-muted-foreground">/{billingPeriod === 'yearly' ? 'an' : 'mois'}</span>
                  </div>
                  {billingPeriod === 'yearly' && plan.price > 0 && (
                    <p className="text-xs text-muted-foreground line-through">
                      {(plan.price * 12).toLocaleString()} FCFA/an
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">Facturé {billingPeriod === 'yearly' ? 'annuellement' : 'mensuellement'}</p>
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

        {/* Plan Sur Mesure */}
        {filteredPlans.find(p => p.name.includes('custom')) && (
          <Card className="p-6 sm:p-8 mb-8 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white border-slate-700 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold mb-2">
                  {effectiveType === 'UNIVERSITY' ? 'Université' : 'Lycée'} - Sur Mesure
                </h3>
                <p className="text-sm text-slate-300">
                  Solution personnalisée pour les grandes structures. Contactez-nous pour un devis adapté.
                </p>
              </div>
              <Button
                onClick={handleContactSupport}
                className="bg-white text-slate-900 hover:bg-slate-100 flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Contactez-nous
              </Button>
            </div>
          </Card>
        )}

        {/* Tableau comparatif */}
        {filteredPlans.length > 0 && (
          <div className="mt-8 max-w-5xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold">Comparer les plans</h2>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-sm w-1/4"></th>
                    {filteredPlans.filter(p => !p.name.includes('custom')).map((plan) => {
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
                  {/* Lignes de comparaison par catégorie */}
                  {Object.entries(
                    filteredComparisonRows.reduce((acc, row) => {
                      const simpleCat = row.category.replace(/ - (Université|Lycée)$/, '')
                      if (!acc[simpleCat]) acc[simpleCat] = []
                      acc[simpleCat].push(row)
                      return acc
                    }, {} as Record<string, ComparisonRow[]>)
                  ).map(([category, categoryRows]) => (
                    <React.Fragment key={category}>
                      <tr className="border-b border-border bg-muted/20">
                        <td className="p-3 font-semibold text-sm" colSpan={filteredPlans.filter(p => !p.name.includes('custom')).length + 1}>
                          {category}
                        </td>
                      </tr>
                      {categoryRows.map((row) => (
                        <tr key={row.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="p-3 text-sm">
                            <span>{row.label}</span>
                          </td>
                          {filteredPlans.filter(p => !p.name.includes('custom')).map((plan) => {
                            const value = row.values.find(v => v.planId === plan.id)?.value || ''
                            const isCheck = value === '✅' || value === '✓' || value.toLowerCase() === 'oui'
                            const isCross = value === '❌' || value === '✗' || value.toLowerCase() === 'non'
                            const isPopular = plan.isPopular
                            
                            return (
                              <td 
                                key={plan.id} 
                                className={`text-center p-3 text-sm ${isPopular ? 'bg-blue-500/5' : ''}`}
                              >
                                {isCheck ? (
                                  <Check className="h-4 w-4 text-green-500 mx-auto" />
                                ) : isCross ? (
                                  <span className="text-muted-foreground">×</span>
                                ) : (
                                  <span>{value}</span>
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
