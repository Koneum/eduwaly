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
  currentPlan?: string
}

export function PricingSection({ onSelectPlan, showTrialInfo = true, currentPlan }: PricingSectionProps) {
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

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col p-4 sm:p-6 ${
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

              <div className="mb-4 sm:mb-6 ">
                <h3 className="text-responsive-lg gap-2 font-semibold mb-2">{plan.displayName}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  {plan.price !== "Sur devis" && (
                    <>
                      <span className="text-responsive-2xl font-bold">{plan.price}</span>
                      <span className="text-responsive-xs text-muted-foreground">{plan.currency}</span>
                    </>
                  )}
                  {plan.price === "Sur devis" && (
                    <span className="text-responsive-xl font-bold">{plan.price}</span>
                  )}
                  {plan.period && (
                    <span className="text-responsive-sm text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="text-responsive-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-responsive-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => onSelectPlan?.(plan.name)}
                disabled={currentPlan === plan.name}
                className={`w-full ${
                  plan.highlighted
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {currentPlan === plan.name ? "Plan actuel" : plan.cta}
              </Button>
            </Card>
          ))}
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

        {/* Tableau comparatif détaillé */}
        <div className="mt-12 sm:mt-20">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-responsive-xl font-bold mb-3 sm:mb-4">Comparez les fonctionnalités</h2>
            <p className="text-muted-foreground text-responsive-base">
              Tableau détaillé de toutes les fonctionnalités par plan
            </p>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left p-2 sm:p-4 font-semibold text-responsive-sm">Fonctionnalité</th>
                  <th className="text-center p-2 sm:p-4 font-semibold text-responsive-xs">STARTER</th>
                  <th className="text-center p-2 sm:p-4 font-semibold text-responsive-xs">PROFESSIONAL</th>
                  <th className="text-center p-2 sm:p-4 font-semibold text-responsive-xs bg-primary/5">BUSINESS</th>
                  <th className="text-center p-2 sm:p-4 font-semibold text-responsive-xs">ENTERPRISE</th>
                </tr>
              </thead>
              <tbody>
                {/* Prix */}
                <tr className="border-b border-border bg-muted/30">
                  <td className="p-2 sm:p-4 font-semibold text-responsive-sm" colSpan={5}>Tarifs & Limites</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Prix (FCFA/mois)</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs font-semibold">5 000</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs font-semibold">12 500</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs font-semibold bg-primary/5">25 000</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs font-semibold">Sur devis</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Étudiants max</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">100</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">500</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">2000</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">∞</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Enseignants max</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">10</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">50</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">200</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">∞</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Stockage</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">5 GB</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">50 GB</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">200 GB</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">∞</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Emails/mois</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">100</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">500</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">1000</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">∞</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">SMS/mois</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">1000</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">∞</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Campus</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">1</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">1</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">5</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">∞</td>
                </tr>

                {/* Gestion de base */}
                <tr className="border-b border-border bg-muted/30">
                  <td className="p-2 sm:p-4 font-semibold text-responsive-sm" colSpan={5}>Gestion de Base</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Gestion étudiants</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Gestion enseignants</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Gestion parents</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                </tr>

                {/* Académique */}
                <tr className="border-b border-border bg-muted/30">
                  <td className="p-2 sm:p-4 font-semibold text-responsive-sm" colSpan={5}>Académique</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Emplois du temps</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Notes & bulletins</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Présences avancées</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                </tr>

                {/* Finance */}
                <tr className="border-b border-border bg-muted/30">
                  <td className="p-2 sm:p-4 font-semibold text-responsive-sm" colSpan={5}>Finance</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Frais & paiements manuels</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Paiement en ligne</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Rappels automatiques</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                </tr>

                {/* Communication */}
                <tr className="border-b border-border bg-muted/30">
                  <td className="p-2 sm:p-4 font-semibold text-responsive-sm" colSpan={5}>Communication</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Messagerie interne</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Notifications SMS</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                </tr>

                {/* Devoirs */}
                <tr className="border-b border-border bg-muted/30">
                  <td className="p-2 sm:p-4 font-semibold text-responsive-sm" colSpan={5}>Devoirs & Soumissions</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Création & correction</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                </tr>

                {/* Reporting */}
                <tr className="border-b border-border bg-muted/30">
                  <td className="p-2 sm:p-4 font-semibold text-responsive-sm" colSpan={5}>Reporting & Analytics</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Rapports avancés</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Analytics & BI</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                </tr>

                {/* Technique */}
                <tr className="border-b border-border bg-muted/30">
                  <td className="p-2 sm:p-4 font-semibold text-responsive-sm" colSpan={5}>Fonctionnalités Techniques</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Multi-campus</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">✅ (5 max)</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅ (∞)</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">API & Webhooks</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">SSO & 2FA</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Branding personnalisé</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                </tr>

                {/* Support */}
                <tr className="border-b border-border bg-muted/30">
                  <td className="p-2 sm:p-4 font-semibold text-responsive-sm" colSpan={5}>Support</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Email</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Chat</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">✅</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-responsive-xs">Support prioritaire 24/7</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs bg-primary/5">❌</td>
                  <td className="text-center p-2 sm:p-4 text-responsive-xs">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
