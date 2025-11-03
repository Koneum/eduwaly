"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const plans = [
  {
    name: "STARTER",
    displayName: "Starter",
    price: "5 000",
    currency: "XOF",
    period: "/mois",
    description: "Pour les petites écoles qui débutent.",
    features: [
      "Jusqu'à 100 étudiants",
      "10 enseignants",
      "Gestion des présences basique",
      "Notes individuelles",
      "Bulletins PDF basiques",
      "Support par email",
      "Stockage 5 GB",
    ],
    cta: "Essayer 30 jours gratuits",
    highlighted: false,
  },
  {
    name: "PROFESSIONAL",
    displayName: "Professional",
    price: "12 500",
    currency: "XOF",
    period: "/mois",
    description: "Pour les écoles en croissance.",
    features: [
      "Jusqu'à 500 étudiants",
      "50 enseignants",
      "Toutes les fonctionnalités Starter",
      "Messagerie interne",
      "Devoirs et soumissions",
      "Notifications email (500/mois)",
      "Rapports avancés",
      "Stockage 50 GB",
      "Support email + chat",
    ],
    cta: "Essayer 30 jours gratuits",
    highlighted: false,
  },
  {
    name: "BUSINESS",
    displayName: "Business",
    price: "25 000",
    currency: "XOF",
    period: "/mois",
    description: "Pour les grandes institutions.",
    badge: "Recommandé",
    features: [
      "Jusqu'à 2000 étudiants",
      "200 enseignants",
      "Toutes les fonctionnalités Pro",
      "Paiement en ligne (Stripe)",
      "Multi-campus (5 max)",
      "Notifications SMS (1000/mois)",
      "API et webhooks",
      "Stockage 200 GB",
      "Support prioritaire",
    ],
    cta: "Essayer 30 jours gratuits",
    highlighted: true,
  },
  {
    name: "ENTERPRISE",
    displayName: "Enterprise",
    price: "Sur devis",
    currency: "",
    period: "",
    description: "Pour les réseaux d'établissements.",
    features: [
      "Étudiants illimités",
      "Enseignants illimités",
      "Toutes les fonctionnalités Business",
      "Infrastructure dédiée",
      "Branding personnalisé",
      "SSO et 2FA",
      "SLA 99.9%",
      "Support 24/7 dédié",
    ],
    cta: "Nous contacter",
    highlighted: false,
  },
]

interface PricingSectionProps {
  onSelectPlan?: (planName: string) => void
  showTrialInfo?: boolean
}

export function PricingSection({ onSelectPlan, showTrialInfo = true }: PricingSectionProps) {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-balance">
              Plans et Tarifs
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground text-lg md:text-xl text-balance">
              Choisissez le plan adapté à votre établissement. Commencez avec 30 jours gratuits.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4 lg:gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col p-6 ${
                plan.highlighted
                  ? "border-primary shadow-lg shadow-primary/20 scale-105"
                  : "border-border"
              }`}
            >
              {plan.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  {plan.badge}
                </Badge>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.displayName}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  {plan.price !== "Sur devis" && (
                    <>
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">{plan.currency}</span>
                    </>
                  )}
                  {plan.price === "Sur devis" && (
                    <span className="text-3xl font-bold">{plan.price}</span>
                  )}
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => onSelectPlan?.(plan.name)}
                className={`w-full ${
                  plan.highlighted
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>

        {showTrialInfo && (
          <div className="mt-12 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              🎉 <strong>Offre de lancement BETA</strong> : 30 jours gratuits pour tous les nouveaux inscrits
            </p>
            <p className="text-xs text-muted-foreground">
              Aucune carte bancaire requise. Annulez à tout moment.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
