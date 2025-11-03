# Script pour créer la page de pricing
# Partie 3 - Basé sur le design fourni

Write-Host "🚀 Création de la page de pricing..." -ForegroundColor Cyan

# 1. Composant PricingSection adapté
Write-Host "`n📝 Création du composant PricingSection..." -ForegroundColor Yellow
$pricingContent = @'
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
'@

New-Item -ItemType Directory -Path "d:\react\UE-GI app\schooly\components\pricing" -Force | Out-Null
Set-Content -Path "d:\react\UE-GI app\schooly\components\pricing\PricingSection.tsx" -Value $pricingContent
Write-Host "✅ components/pricing/PricingSection.tsx créé" -ForegroundColor Green

# 2. Page publique de pricing
Write-Host "`n📝 Création de la page publique..." -ForegroundColor Yellow
$publicPageContent = @'
import { PricingSection } from "@/components/pricing/PricingSection"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la connexion
          </Button>
        </Link>
      </div>
      
      <PricingSection />
      
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Prêt à commencer ?</h2>
        <p className="text-muted-foreground mb-6">
          Créez votre compte et profitez de 30 jours d'essai gratuit
        </p>
        <Link href="/register">
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Créer mon compte gratuitement
          </Button>
        </Link>
      </div>
    </div>
  )
}
'@

New-Item -ItemType Directory -Path "d:\react\UE-GI app\schooly\app\pricing" -Force | Out-Null
Set-Content -Path "d:\react\UE-GI app\schooly\app\pricing\page.tsx" -Value $publicPageContent
Write-Host "✅ app/pricing/page.tsx créé" -ForegroundColor Green

# 3. Composant de sélection de plan dans le dashboard
Write-Host "`n📝 Création du composant PlanSelector..." -ForegroundColor Yellow
$planSelectorContent = @'
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
'@

Set-Content -Path "d:\react\UE-GI app\schooly\components\pricing\PlanSelector.tsx" -Value $planSelectorContent
Write-Host "✅ components/pricing/PlanSelector.tsx créé" -ForegroundColor Green

# 4. Documentation d'utilisation
Write-Host "`n📝 Création de la documentation..." -ForegroundColor Yellow
$docContent = @'
# 📚 Documentation du Système d'Abonnement

## 🎯 Vue d'Ensemble

Le système d'abonnement permet de :
- Gérer 4 plans (STARTER, PROFESSIONAL, BUSINESS, ENTERPRISE)
- Vérifier les fonctionnalités disponibles (feature flags)
- Contrôler les limites (quotas)
- Afficher des avertissements quand les limites sont approchées

## 📦 Fichiers Créés

### Types et Configuration
- `types/subscription.ts` - Types TypeScript et configuration des plans
- `lib/subscription/features.ts` - Utilitaires de vérification

### Hooks et Composants
- `lib/subscription/useSubscription.ts` - Hook React pour accéder à l'abonnement
- `components/subscription/FeatureGate.tsx` - Composant pour bloquer/afficher selon feature
- `components/subscription/LimitWarning.tsx` - Afficher avertissements de limite
- `components/pricing/PricingSection.tsx` - Section de tarification
- `components/pricing/PlanSelector.tsx` - Sélecteur de plan

### Middleware et API
- `lib/subscription/middleware.ts` - Vérification des limites côté serveur
- `app/api/subscription/current/route.ts` - API pour récupérer l'abonnement

### Pages
- `app/pricing/page.tsx` - Page publique de tarification

## 🚀 Utilisation

### 1. Vérifier une Fonctionnalité (Feature Flag)

```tsx
import { FeatureGate } from '@/components/subscription/FeatureGate'

// Bloquer une fonctionnalité si non disponible
<FeatureGate feature="messaging_internal">
  <MessagingInterface />
</FeatureGate>

// Avec message personnalisé
<FeatureGate 
  feature="payments_online"
  fallback={<p>Paiement en ligne non disponible</p>}
>
  <OnlinePaymentForm />
</FeatureGate>
```

### 2. Vérifier dans le Code

```tsx
import { useSubscription } from '@/lib/subscription/useSubscription'

function MyComponent() {
  const { checkFeature } = useSubscription()
  
  if (checkFeature('homework_submissions')) {
    // Afficher le formulaire de soumission
  }
}
```

### 3. Afficher un Avertissement de Limite

```tsx
import { LimitWarning } from '@/components/subscription/LimitWarning'

<LimitWarning 
  limitType="maxStudents"
  currentValue={studentCount}
  schoolId={schoolId}
/>
```

### 4. Vérifier les Limites dans une API

```tsx
import { withLimitCheck } from '@/lib/subscription/middleware'

export async function POST(request: Request) {
  const { schoolId } = await request.json()
  
  return withLimitCheck(schoolId, 'maxStudents', async () => {
    // Créer l'étudiant
    const student = await prisma.student.create({...})
    return NextResponse.json(student)
  })
}
```

### 5. Vérification Manuelle

```tsx
import { checkSchoolLimit } from '@/lib/subscription/middleware'

const check = await checkSchoolLimit(schoolId, 'maxTeachers')

if (!check.allowed) {
  return NextResponse.json(
    { error: check.message },
    { status: 403 }
  )
}
```

## 📋 Liste des Features Disponibles

### Communication
- `messaging_internal` - Messagerie interne
- `notifications_email` - Notifications par email
- `notifications_sms` - Notifications par SMS
- `announcements` - Système d'annonces

### Académique
- `homework_assignments` - Création de devoirs
- `homework_submissions` - Soumission de devoirs
- `evaluations_individual` - Évaluations individuelles
- `evaluations_group` - Évaluations de groupe
- `attendance_basic` - Présences basiques
- `attendance_advanced` - Présences avancées
- `grade_reports_basic` - Bulletins basiques
- `grade_reports_advanced` - Bulletins avancés

### Documents
- `documents_pdf_only` - Documents PDF uniquement
- `documents_all_types` - Tous types de documents
- `documents_videos` - Upload de vidéos
- `documents_library` - Bibliothèque de documents

### Finance
- `payments_manual` - Paiements manuels
- `payments_online` - Paiements en ligne
- `payments_reminders_email` - Rappels par email
- `payments_reminders_sms` - Rappels par SMS
- `scholarships` - Gestion des bourses
- `financial_reports_basic` - Rapports financiers basiques
- `financial_reports_advanced` - Rapports financiers avancés

### Rapports
- `reports_csv_export` - Export CSV
- `reports_pdf_basic` - Rapports PDF basiques
- `reports_pdf_advanced` - Rapports PDF avancés
- `reports_statistics` - Rapports statistiques
- `reports_predictive` - Rapports prédictifs

### Système
- `permissions_system` - Système de permissions
- `multi_campus` - Multi-campus
- `api_access` - Accès API
- `webhooks` - Webhooks
- `custom_branding` - Branding personnalisé
- `sso` - Single Sign-On
- `two_factor_auth` - Authentification 2FA

## 📊 Limites Disponibles

- `maxStudents` - Nombre maximum d'étudiants
- `maxTeachers` - Nombre maximum d'enseignants
- `maxAdminStaff` - Nombre maximum de personnel admin
- `maxClasses` - Nombre maximum de classes
- `maxModules` - Nombre maximum de modules
- `maxRooms` - Nombre maximum de salles
- `storageGB` - Stockage en GB
- `emailsPerMonth` - Emails par mois
- `smsPerMonth` - SMS par mois
- `maxCampus` - Nombre maximum de campus

## ✅ Prochaines Étapes

1. Intégrer `FeatureGate` dans les pages existantes
2. Ajouter `LimitWarning` dans les managers
3. Utiliser `withLimitCheck` dans les APIs de création
4. Tester le système complet
5. Intégrer Stripe pour les paiements

## 📝 Notes

- Les valeurs `-1` dans les limites signifient "illimité"
- Le plan TRIAL donne accès au plan PROFESSIONAL pendant 30 jours
- Les feature flags sont vérifiés côté client ET serveur
'@

Set-Content -Path "d:\react\UE-GI app\schooly\SUBSCRIPTION_SYSTEM.md" -Value $docContent
Write-Host "✅ SUBSCRIPTION_SYSTEM.md créé" -ForegroundColor Green

Write-Host "`n✨ Système complet créé avec succès!" -ForegroundColor Green
Write-Host "`n📦 Résumé des fichiers créés:" -ForegroundColor Cyan
Write-Host "  Types & Config:" -ForegroundColor Yellow
Write-Host "    - types/subscription.ts" -ForegroundColor White
Write-Host "    - lib/subscription/features.ts" -ForegroundColor White
Write-Host "  Hooks & Components:" -ForegroundColor Yellow
Write-Host "    - lib/subscription/useSubscription.ts" -ForegroundColor White
Write-Host "    - components/subscription/FeatureGate.tsx" -ForegroundColor White
Write-Host "    - components/subscription/LimitWarning.tsx" -ForegroundColor White
Write-Host "    - components/pricing/PricingSection.tsx" -ForegroundColor White
Write-Host "    - components/pricing/PlanSelector.tsx" -ForegroundColor White
Write-Host "  Middleware & API:" -ForegroundColor Yellow
Write-Host "    - lib/subscription/middleware.ts" -ForegroundColor White
Write-Host "    - app/api/subscription/current/route.ts" -ForegroundColor White
Write-Host "  Pages:" -ForegroundColor Yellow
Write-Host "    - app/pricing/page.tsx" -ForegroundColor White
Write-Host "  Documentation:" -ForegroundColor Yellow
Write-Host "    - SUBSCRIPTION_SYSTEM.md" -ForegroundColor White

Write-Host "`n🎯 Pour utiliser le système:" -ForegroundColor Cyan
Write-Host "  1. Exécutez: npm install sonner (pour les toasts)" -ForegroundColor White
Write-Host "  2. Lisez SUBSCRIPTION_SYSTEM.md pour les exemples d'utilisation" -ForegroundColor White
Write-Host "  3. Intégrez FeatureGate dans vos composants" -ForegroundColor White
Write-Host "  4. Ajoutez withLimitCheck dans vos APIs" -ForegroundColor White
